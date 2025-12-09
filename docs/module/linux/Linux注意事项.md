## 设置主机名和host映射

### windows

在`C:/Windows/System32/driver/etc/hosts`

```powershell
notepad.exe hosts
```

案例：使用域名 ubuntu22 访问宝塔面板布置好的wordpress

步骤：

1. 在Windows上修改hosts文件 `ubuntu_ip ubuntu22`

2. 在linux上修改nginx的配置文件 server块

   ```shell
   server{
   listen 80
   servername ip ubuntu22 #可以映射多个servername，这样子就可以通过ip或者域名访问
   }
   ```

   进行文件的`reload`和重启nginx(在宝塔面板中修改可以忽略这一步操作)，此时可以直接通过域名访问了，但是呢，访问时会出现某些图标不显示（使用ip访问时才会显示，这是因为css采用了固定的ip地址去获取图标，需要对其进行修改才能显示）

3. 操作：

   #### 【推荐】修改 WordPress 配置，自动替换 IP 为域名

   ##### 步骤 1：进入 WordPress 数据库

   1. 宝塔 → 【数据库】→ 找到你的 WordPress 数据库。
   2. 点击【phpMyAdmin】打开数据库管理界面。

   ##### 步骤 2：查找写死 IP 的内容

   1. 在左侧选择数据库。

   2. 搜索含有 IP 地址的内容：

      ```sql
      SELECT * FROM wp_posts WHERE post_content LIKE '%192.168.1.100%';
      ```

   3. 如果有结果，说明文章、插件或主题设置了固定 IP。

​		**步骤 3：批量替换 IP 为域名**

​			执行 SQL 替换语句（请将 `192.168.1.100` 和 `example.com` 替换为你自己的）：

```sql
UPDATE wp_posts SET post_content = REPLACE(post_content, 'http://192.168.1.100', 'https://example.com ');
```

### linux

**在/etc/hosts 文件 指定** 

案例：192.168.31.119 windows

## 关于 EXPORT 变量的说法

**使用 `bash script.sh` 或 `./script.sh` 执行（最常见）**

**结论：完全没有影响。**

- **原因**：这种方式会启动一个**新的子Shell进程**来执行脚本。
- **过程**：
  1. 当前Shell（父进程）创建一个子进程。
  2. 子进程执行脚本中的 `export` 命令，在其**自己的进程环境**中创建或修改环境变量。
  3. 脚本执行完毕，子进程终止。
  4. 子进程的所有资源（包括其内存和环境变量）都被操作系统回收。
  5. 控制权返回给父进程（原来的Shell），父进程的环境自始至终**完全没有被触及**。

**示例：**
假设有脚本 `set_var.sh`：

```bash
#!/bin/bash
export MY_VAR="I was set in a script"
echo "Inside script: MY_VAR = $MY_VAR"
```

在终端中执行：

```bash
$ bash set_var.sh
Inside script: MY_VAR = I was set in a script  # 子进程中有效

$ echo $MY_VAR
                              # 输出为空！父进程环境不变
```

**注意**

**除非使用source命令执行，会影响到当前的登录 session 当中，除非关闭session或者是 手动unset那个变量；它才会消失**

**其他方面：**

- **不是**子进程主动去父进程那里找 `$变量`。
- **而是**父进程只把自己想传递的（即 `export` 过的）变量打包成一个“环境变量列表”。
- 当创建子进程时，操作系统将这个列表**复制**给子进程，成为子进程的初始环境。
- 子进程只能访问到这个被复制过来的列表，而无法知晓列表之外的任何父进程信息。

所以，`export` 的本质就是 **“变量出境许可”**。父进程不给许可（`export`），变量就无法“出境”到子进程的环境中。子进程在“境外”，自然无法访问父进程“境内”的普通变量。

```bash
# 在父 Shell 中
$ MY_VAR="This is a secret"   # 定义一个普通的 Shell 变量，未导出
$ export PUB_VAR="This is public" # 定义并导出一个环境变量

# 启动一个子进程（bash）
$ bash

# 现在我们进入了子 Shell
$ echo $PUB_VAR  # 子进程尝试访问 PUB_VAR
This is public   # 成功！因为父进程通过环境变量列表传给了它

$ echo $MY_VAR   # 子进程尝试访问 MY_VAR
                 # 输出空行！失败！
                 # 因为 MY_VAR 不在父进程传递过来的环境列表里，
                 # 子进程根本不知道它的存在。

# 即使在子Shell中定义一个同名变量，它也是另一个全新变量
$ MY_VAR="I'm a different variable in the child"
$ exit # 退出子Shell，回到父Shell

# 回到父Shell，检查最初的 MY_VAR
$ echo $MY_VAR
This is a secret # 完全没受影响
```

**拓展**

> `export http_proxy` 能起作用，**100% 依赖于子进程内部的代码是否被编写为去主动识别和使用这个环境变量**。
>
> ​	Bash 的 `export` 命令只是一个**广播系统**，它负责把变量放进“环境”这个频道里。但是，**有没有收音机（子进程）来调频到这个频道并收听内容，完全取决于收音机自己**。
>
> ------
>
> ### 子进程内部的代码逻辑
>
> 像 `curl`、`wget`、`apt-get` 这样的程序，它们的源代码中通常会有类似下面这样的逻辑（这是概念性的伪代码）：
>
> ```c
> // 在 curl 或 wget 的初始化函数中...
> int main() {
>     // 1. 读取配置文件中的代理设置...
>     
>     // 2. 检查命令行参数是否有 --proxy 选项...
>     //    命令行参数的优先级通常最高
>     
>     // 3. 如果前面都没有设置，则检查环境变量
>     char *proxy_env = getenv("http_proxy"); // <-- 关键系统调用！
>     if (proxy_env == NULL) {
>         // 如果小写的没找到，再尝试找大写的（某些程序会这样做）
>         proxy_env = getenv("HTTP_PROXY");
>     }
>     
>     if (proxy_env != NULL) {
>         // 4. 找到了！解析环境变量的值（如 "http://proxy:port"）
>         //    并将其设置为本次网络请求使用的代理
>         set_proxy(parse_proxy_url(proxy_env));
>     } else {
>         // 5. 没找到环境变量，直接连接，不走代理
>         set_direct_connection();
>     }
>     
>     // ... 执行接下来的网络请求操作
> }
> ```
>
> ### 关键系统调用：`getenv()`
>
> - `getenv("http_proxy")` 是一个标准 C 库函数。
> - 它的作用就是：**在当前进程的环境变量列表（即父进程传过来的那份副本）中，查找名为 `"http_proxy"` 的变量**。
> - 如果找到，就返回它的值（例如 `http://proxy:port`）；如果找不到，就返回 `NULL`。

## source命令的本质

**`source` 命令的本质是：在当前 Shell 进程中，读取并执行指定文件中的命令。**

**与普通执行脚本的根本区别：新进程 vs 当前进程**

- **普通执行脚本** (`bash script.sh` 或 `./script.sh`)：
  - Shell 会启动一个**新的子进程**（一个新的 Bash 程序）。
  - 这个新进程在自己的内存空间中执行脚本文件中的命令。
  - 执行完毕后，这个子进程**退出**，其内部设置的所有变量、函数、别名等也随之消失。
  - 控制权返回给父进程（原来的 Shell），**父进程的环境不会受到任何影响**。
- **使用 `source` 执行脚本** (`source script.sh` 或 `. script.sh`)：
  - Shell **不会创建新进程**。
  - 它直接在当前 Shell 进程的内存空间中，打开指定的脚本文件，并一行一行地读取和执行其中的命令，就像你亲手把这些命令输入到终端里一样。
  - 脚本中所有命令产生的**副作用**（如设置环境变量、改变当前目录、定义函数）都会**直接且永久地改变当前 Shell 的环境**。

#### 举个例子

> 假设有一个文件 `test.sh`，内容如下：
>
> ```bash
> #!/bin/bash
> export MY_VAR="Hello World"
> cd /tmp
> ```
>
> - **方式一：** `bash test.sh`
>   - 执行后，你当前的目录没变，执行 `echo $MY_VAR` 也什么都没有。因为变化都发生在那個已经消亡的子进程里。
> - **方式二：** `source test.sh`
>   - 执行后，你会发现你的当前工作目录已经变成了 `/tmp`，并且执行 `echo $MY_VAR` 会输出 `Hello World`。因为这些操作直接作用于你当前的 Shell。

#### 两种写法：`source` 和 `.`

`source filename` 和 `. filename` 是**完全等价**的。`.` 是 `source` 的 POSIX 标准写法，更通用。`source` 是 Bash 提供的更直观的别名，可读性更好。它们的功能没有任何区别。

## 在 Ubuntu 22.04 Server 上查看和管理磁盘分区

- 需要先增添磁盘
- 然后对磁盘在进行分区
  - 分区挂载指定目录
  - 再设置实现永久挂载

### 查看现有磁盘和分区

1. **使用 `lsblk` 命令查看所有块设备**：
   ```bash
   lsblk
   ```
   这会显示所有磁盘及其分区，包括挂载点信息。

2. **使用 `fdisk` 查看详细信息**：
   ```bash
   sudo fdisk -l
   ```
   这会显示更详细的磁盘和分区信息，包括文件系统类型。

3. **使用 `df` 查看已挂载分区**：
   ```bash
   df -h
   ```
   显示已挂载文件系统的使用情况。

### 新增磁盘并分区

#### 1. 识别新磁盘

首先确认系统已识别新磁盘：
```bash
sudo lsblk
```
或
```bash
sudo fdisk -l
-f #更详细的信息
```

新添加的磁盘通常会显示为 `/dev/sdb`、`/dev/sdc` 等（如果是NVMe磁盘则是 `/dev/nvme0n1` 等）。

#### 2. 对新磁盘进行分区

假设新磁盘是 `/dev/sdb`：

```bash
sudo fdisk /dev/sdb
```

在 fdisk 交互界面中：
- 输入 `n` 创建新分区
- 选择分区类型（主分区 `p` 或扩展分区 `e`）
  - **示例**
    - 输入 `n` 创建新分区：
      - 选择 `p`（主分区）。
      - 起始扇区：默认（直接按 `Enter`）。
      - 结束扇区：`+20G`（分配 20GB）。

    - 再次输入 `n` 创建第二个分区：
      - 选择 `p`（主分区）。
      - 起始扇区：默认。
      - 结束扇区：`+30G`（分配 30GB）。

- 设置分区号（通常默认即可）
- 设置起始扇区（默认）
- 设置结束扇区或大小（如 `+20G` 表示20GB分区）
- 输入 `w` 保存并退出

##### 拓展

###### 磁盘分区类型与参数设置汇总表

> | **选项**            | **作用**                                                     | **推荐设置**                                                 |
> | ------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
> | **主分区（`p`）**   | - 直接存储数据，可格式化挂载<br>- **MBR 最多 4 个主分区**<br>- GPT 无限制 | **GPT 磁盘**：全用主分区<br>**MBR 磁盘**：≤4 分区时全用主分区 |
> | **扩展分区（`e`）** | - 仅用于 MBR 磁盘，突破 4 分区限制<br>- 本身不存储数据，需再分逻辑分区 | **MBR 磁盘**：需 >4 分区时，用 `3主分区 + 1扩展分区`，再分逻辑分区 |
> | **逻辑分区**        | - 在扩展分区内创建<br>- 命名从 `5` 开始（如 `/dev/sda5`）    | 仅 MBR 磁盘需要                                              |
> | **起始扇区**        | - 分区开始的磁盘位置<br>- 影响对齐和性能                     | **默认值**（通常 2048 扇区，1MiB 对齐）                      |
> | **结束扇区/大小**   | - 决定分区大小<br>- 可输入绝对扇区或相对大小（如 `+20G`）    | `+20G`（固定大小）<br>`+100%`（占用剩余所有空间）            |
>
> ---
>
> #### 关键区别速查
> #### **1. 主分区 vs 扩展分区**
> | **对比项**       | **主分区（`p`）**  | **扩展分区（`e`）**              |
> | ---------------- | ------------------ | -------------------------------- |
> | **是否直接可用** | 是（可格式化挂载） | 否（需再分逻辑分区）             |
> | **MBR 限制**     | 最多 4 个          | 1 个扩展分区（内含多个逻辑分区） |
> | **GPT 支持**     | 支持，无数量限制   | 不需要（GPT 直接支持 >4 主分区） |
>
> #### **2. 起始/结束扇区设置**
> | **参数**     | **作用**                 | **示例**                                   |
> | ------------ | ------------------------ | ------------------------------------------ |
> | **起始扇区** | 分区起始位置（影响性能） | 默认 `2048`（1MiB 对齐）                   |
> | **结束扇区** | 分区结束位置或大小       | `+20G`（分配 20GB）<br>`+100%`（占满剩余） |
>
> ---
>
> **一句话总结**
>
> - **主分区（`p`）**：直接可用，MBR 最多 4 个，GPT 无限制。  
> - **扩展分区（`e`）**：仅 MBR 需要，用于突破 4 分区限制，需再分逻辑分区。  
> - **起始扇区**：默认对齐即可（通常 2048）。  
> - **结束扇区**：`+大小`（如 `+20G`）或 `+100%`（占满剩余空间）。  
>
> **现代系统（UEFI + GPT）直接全用主分区，无需扩展分区！**

#### 3. 格式化分区

假设创建了 `/dev/sdb1`：

```bash
sudo mkfs.ext4 /dev/sdb1  # 格式化为ext4文件系统
# 或者使用其他文件系统，如：
# sudo mkfs.xfs /dev/sdb1
```

#### 4. 挂载分区

创建挂载点并挂载：
```bash
sudo mkdir /mnt/newdisk
sudo mount /dev/sdb1 /mnt/newdisk
```

#### 5. 设置开机自动挂载

编辑 `/etc/fstab` 文件：
```bash
sudo nano /etc/fstab
```

添加一行（使用 `blkid` 获取UUID）：
```shell
UUID=你的分区UUID /mnt/newdisk ext4 defaults 0 2
```

保存后测试：
```bash
sudo mount -a
```

### 使用 LVM 管理磁盘（可选）

如果需要更灵活的磁盘管理，可以考虑使用 LVM：

1. 安装 LVM：
   ```bash
   sudo apt install lvm2
   ```

2. 创建物理卷：
   ```bash
   sudo pvcreate /dev/sdb1
   ```

3. 创建卷组：
   ```bash
   sudo vgcreate vg_name /dev/sdb1
   ```

4. 创建逻辑卷：
   ```bash
   sudo lvcreate -L 20G -n lv_name vg_name
   ```

5. 格式化和挂载逻辑卷：
   ```bash
   sudo mkfs.ext4 /dev/vg_name/lv_name
   sudo mkdir /mnt/lvm_volume
   sudo mount /dev/vg_name/lv_name /mnt/lvm_volume
   ```

**注意事项**

1. 操作磁盘分区有风险，请确保备份重要数据
2. 在生产环境中操作前，建议先在测试环境练习
3. 如果磁盘已包含数据，请谨慎操作以免数据丢失
4. 对于大容量磁盘，考虑使用 GPT 分区表而非 MBR

## 防火墙

防火墙就像是一道“门卫”，控制进出你电脑的网络流量。它可以：

- 允许某些程序访问网络
- 拒绝某些恶意或不安全的连接
- 防止外部攻击

在 Ubuntu 中，最常用的防火墙工具是：`ufw`（Uncomplicated Firewall）

---

### 什么是 `ufw`？

`	ufw` 是 Ubuntu 默认提供的一个**简单易用的防火墙管理工具**，它的设计目标就是让防火墙配置变得简单，适合桌面和服务器使用。

---

#### 查看防火墙状态

首先你可以检查一下你的系统上防火墙是否已经启用：

```bash
sudo ufw status
```

默认情况下，可能输出是：

```
Status: inactive
```

表示防火墙目前没有启动。

---

####  启动防火墙

要启用防火墙，运行：

```bash
sudo ufw enable
```

再次查看状态：

```bash
sudo ufw status
```

输出应该是：

```
Status: active
```

---

#### 设置默认策略（建议一开始就设置）

默认情况下，你可以设置防火墙的“默认规则”：

```bash
# 默认拒绝所有入站（别人不能随便连你）
sudo ufw default deny incoming

# 默认允许出站（你可以正常上网）
sudo ufw default allow outgoing
```

这样就形成了一个基本的安全防护机制。

---

#### 开放特定端口（比如 SSH、HTTP、HTTPS）

##### 示例1：开放 SSH 端口（22）

如果你远程通过 SSH 登录服务器，必须开放这个端口：

```bash
sudo ufw allow 22
```

也可以更明确地写：

```bash
sudo ufw allow ssh
```

> 因为 `ssh` 是一个已知服务名，对应的是端口 22。

---

##### 示例2：开放 HTTP 和 HTTPS 端口（80 / 443）

如果你在 Ubuntu 上部署了网站服务器（如 Nginx 或 Apache），需要开放这些端口：

```bash
sudo ufw allow http
sudo ufw allow https
```

或者直接写端口号：

```bash
sudo ufw allow 80
sudo ufw allow 443
```

---

##### 示例3：开放某个范围的端口

比如你想开放从 1000 到 2000 的所有 TCP 端口：

```bash
sudo ufw allow 1000:2000/tcp
```

---

####  限制来源 IP 访问（高级）

你可以限制只有某个 IP 地址才能访问某项服务。

例如，只允许 IP 为 `192.168.1.100` 的设备访问 SSH：

```bash
sudo ufw allow from 192.168.1.100 to any port 22
```

##### 拒绝访问该端口（不关闭服务，只阻止连接）

如果你不想停止服务，但希望外部不能访问这个端口，可以使用 `ufw` 来禁止连接。

```shell
sudo ufw deny 80
```

### 示例：拒绝外部访问 80 端口

####  删除规则

如果你不小心添加了一条规则，可以删除它。

先列出所有规则并编号：

```bash
sudo ufw status numbered
```

输出可能是：

```
Status: active

     To                         Action      From
     --                         ------      ----
[ 1] 22                         ALLOW       Anywhere
[ 2] 80                         ALLOW       Anywhere
```

然后删除第 2 条规则：

```bash
sudo ufw delete 2
```

---

#### 停止或重置防火墙

如果你想暂时关闭防火墙：

```bash
sudo ufw disable
```

如果想恢复到初始状态（清除所有规则）：

```bash
sudo ufw reset
```

## Linux文件系统层级结构的意义

使用 `apt` 安装的软件，系统会自动将其**程序文件、配置文件、库文件、服务脚本等分布到标准的目录结构中**，这就是 Linux 文件系统层级结构（FHS）的意义之一。

### nano编辑器

```bash
^ = Ctrl
M- = Alt(Meta)
```

#### 打开和创建文件

- **打开现有文件**：在终端执行 `nano 文件名`，若文件存在则打开。如 `nano example.txt`。
- **创建新文件**：输入不存在的文件名，如 `nano newfile.txt` 可创建新空白文件。

#### 文本编辑

- **输入文本**：打开文件后直接输入，自动换行。

#### 保存与退出

- **保存文件**：按 `Ctrl + O` ，已存在文件直接回车，新文件输入文件名后回车。
- **退出 Nano**：按 `Ctrl + X` ，有未保存更改时提示是否保存，已保存则直接退出。

#### 剪切、复制与粘贴

- **剪切文本**：光标移至起始位置，按 `Ctrl + K` 剪切至行尾或整行。
- **复制文本**：起始处按 `Alt + 6`（或 `Meta + 6`），末尾按 `Alt + 9`（或 `Meta + 9`）选中，再按 `Alt + 3`（或 `Meta + 3`）复制。
- **粘贴文本**：光标移至粘贴位置，按 `Ctrl + U` 。

#### 查找与替换

- **查找文本**：按 `Ctrl + W` ，输入字符串回车查找，再次按 `Ctrl + W` 查找下一个。
- **替换文本**：按 `Alt + R`（或 `Meta + R`），输入替换前后内容回车，每次替换前提示确认，`Y` 确认，`N` 跳过。

下面是常见的目录说明（以 Debian/Ubuntu 系为例）：

------

###  程序主执行文件

- `/usr/bin/`、`/usr/sbin/`、`/bin/`、`/sbin/`
   → 可执行命令，用户和系统程序都会放在这些目录中
   例如：`nginx` 程序主文件通常在 `/usr/sbin/nginx`

------

### 配置文件

- `/etc/`
   → 所有系统和服务的配置文件都放在这里
   例如：`/etc/nginx/nginx.conf` 是 nginx 的主配置文件

------

###  库文件

- `/usr/lib/`、`/lib/`、`/lib64/`
   → 程序运行时需要的共享库（.so 文件）
   例如：某些应用的插件或依赖库会放在 `/usr/lib/<包名>/` 下

------

###  日志文件

- `/var/log/`
   → 程序或服务的运行日志
   例如：`/var/log/nginx/access.log`、`error.log`

------

###  启动脚本 / systemd 服务文件

- `/etc/init.d/` （旧）或 `/lib/systemd/system/`（现代 systemd 系统）
   → 控制服务启动、重启、停止
   例如：`/lib/systemd/system/nginx.service`

------

###  文档 / 示例 / License

- `/usr/share/doc/<包名>/`
   → 包的说明文档、示例配置、License 等

------

所以总结来说：

> **apt 安装后，系统会根据包的类型自动把不同的文件放到标准目录中，不需要你手动配置路径。**

你想了解某个包具体安装了哪些文件，可以用以下命令：

```bash
dpkg -L <包名>
```

例如：

```bash
dpkg -L nginx
```

会列出 nginx 安装了哪些文件和路径。

# 关于systemctl

​	`systemctl` 是 Linux 系统中用于管理 **systemd**（系统和服务管理器）的主要命令行工具。它用于控制系统的启动、服务（守护进程）、挂载点、套接字等资源，是现代 Linux 发行版（如 Ubuntu 16.04+、CentOS 7+、Fedora、Arch Linux 等）的核心管理工具。

---

### **核心功能**
`systemctl` 主要用于以下操作：
- **启动/停止服务**  
  ```bash
  systemctl start <服务名>    # 启动服务
  systemctl stop <服务名>     # 停止服务
  ```
- **启用/禁用开机自启**  
  ```bash
  systemctl enable <服务名>   # 启用开机自启
  systemctl disable <服务名>  # 禁用开机自启
  ```
- **查看服务状态**  
  ```bash
  systemctl status <服务名>   # 查看详细状态（运行日志、是否活跃等）
  ```
- **重启/重新加载服务**  
  ```bash
  systemctl restart <服务名>  # 重启服务
  systemctl reload <服务名>   # 重新加载配置（不重启）
  ```

---

### **常用命令示例**
| 命令                                  | 说明                                          |
| ------------------------------------- | --------------------------------------------- |
| `systemctl list-units --type=service` | 列出所有已加载的服务                          |
| `systemctl is-active <服务名>`        | 检查服务是否正在运行                          |
| `systemctl is-enabled <服务名>`       | 检查服务是否开机自启                          |
| `systemctl daemon-reload`             | 重新加载 systemd 配置（修改服务文件后需执行） |
| `systemctl reboot`                    | 重启系统                                      |
| `systemctl poweroff`                  | 关闭系统                                      |

---

### **与其他工具对比**
- **旧系统（SysVinit）**：使用 `service` 和 `chkconfig`（如 `service apache2 start`）。  
- **systemd 优势**：更快的启动速度、依赖关系管理、日志集成（通过 `journalctl`）。

---

### **日志查看**
`systemd` 服务的日志由 `journalctl` 管理，常用命令：
```bash
journalctl -u <服务名>      # 查看指定服务的日志
journalctl -f              # 实时跟踪日志
```

---

### **注意事项**
- 需要 **root 权限**（或 `sudo`）执行大多数操作。  
- 修改服务配置后需运行 `systemctl daemon-reload` 生效。  
- 服务名通常不带 `.service` 后缀（如 `nginx` 而非 `nginx.service`）。

## systemctl 管理自定义服务

### 编写服务文件

**路径：`/etc/systemd/system/xxx.service`**

```shell
[Unit]
Description=自定义服务的描述
After=network.target  # 依赖网络启动，可按需修改

[Service]
Type=simple  # 最常用类型，表示该服务就是一个前台进程
User=motor   # 运行该服务的用户（可改为 root、tomcat 等）
ExecStart=/path/to/start.sh  # 启动命令或脚本路径
Restart=always               # 失败后自动重启
RestartSec=5                 # 重启等待时间

[Install]
WantedBy=multi-user.target   # 启动级别，表示正常系统启动就加载
```

### 重新加载 systemd 配置

```shell
sudo systemctl daemon-reexec      # 少用
sudo systemctl daemon-reload      # 推荐，重新读取 .service 文件
```

### 启用并启动服务

```shell
sudo systemctl enable xxx.service     # 开机自启
sudo systemctl start xxx.service      # 启动服务
sudo systemctl status xxx.service     # 查看状态
```

## 举例示范

### Apache Tomcat9

#### tomcat安装路径假设

```bash
/home/motor/tomcat9/
├── bin/
│   ├── startup.sh     # 启动脚本
│   └── shutdown.sh    # 停止脚本
└── ...
```

> 运行用户: motor
>
> Java 路径示例: `/usr/lib/jvm/java-11-openjdk-amd64`

#### 创建 systemd 服务文件

```bash
[Unit]
Description=Apache Tomcat 9.0 Service
After=network.target

[Service]
Type=forking
User=motor
Group=motor
Environment=JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
Environment=CATALINA_HOME=/home/motor/tomcat9
ExecStart=/home/motor/tomcat9/bin/startup.sh
ExecStop=/home/motor/tomcat9/bin/shutdown.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

------

~~~markdown
#  使用 systemctl 管理 Apache Tomcat 9.0 服务（完整笔记）

> 本文记录如何通过 `systemd` 创建并管理一个原本不能直接被 `systemctl` 控制的 Apache Tomcat 9.0 服务，包括服务文件的编写、启动、开机自启设置以及各配置项详解。

---

##  一、Tomcat 安装假设

```bash
/home/motor/tomcat9/
├── bin/
│   ├── startup.sh     # 启动脚本
│   └── shutdown.sh    # 停止脚本
└── ...
~~~

- 运行用户：`motor`
- Java 路径示例：`/usr/lib/jvm/java-11-openjdk-amd64`

------

#### 配置说明（注重必选/可选）

##### [Unit] 段

| 项目                   | 是否必须 | 说明                                 |
| ---------------------- | -------- | ------------------------------------ |
| `Description`          | 可选     | 服务描述，便于识别                   |
| `After=network.target` | 必须     | 表示启动顺序：网络就绪后再启动此服务 |

##### [Service] 段

| 项目              | 是否必须 | 说明                                                         |
| ----------------- | -------- | ------------------------------------------------------------ |
| `Type=forking`    | 必须     | 表示服务以子进程方式运行（Tomcat 使用 startup.sh 启动后会 fork） |
| `User=motor`      | 推荐     | 指定运行服务的用户，避免使用 root                            |
| `Group=motor`     | 可选     | 指定用户组                                                   |
| `Environment=...` | 视需求   | 设置环境变量，如 `JAVA_HOME`、`CATALINA_HOME` 等             |
| `ExecStart=...`   | 必须     | 启动命令路径                                                 |
| `ExecStop=...`    | 推荐     | 停止命令路径，建议优雅关闭服务                               |
| `Restart=always`  | 可选     | 出错时自动重启服务                                           |
| `RestartSec=5`    | 可选     | 重启等待的时间                                               |

###### restart重启策略详解

| 值            | 是否自动重启 | 触发条件                             | 说明                                                 |
| ------------- | ------------ | ------------------------------------ | ---------------------------------------------------- |
| `no`          | 否           | 不管退出是否异常                     | 默认值。服务一旦退出，不会尝试重启。适合一次性任务   |
| `on-success`  | 是           | 正常退出（exit code 0）              | 比较少用，一般服务异常退出才需要重启                 |
| `on-failure`  | 是           | 失败退出（exit code ≠ 0，或 signal） | 推荐用于大多数服务：只有服务出错才自动重启           |
| `on-abnormal` | 是           | 被信号终止、core dump                | 更严格的失败判定，仅信号等异常才重启                 |
| `on-abort`    | 是           | 收到 abort 信号（如 `SIGABRT`）      | 用于特殊调试场景                                     |
| `always`      | 是           | 无论退出状态如何                     | 最常用，服务挂了就重启；正常退出也会被拉起           |
| `on-watchdog` | 是           | 超过 Watchdog 超时时间               | 用于与 `WatchdogSec=` 一起，服务挂起检测（高级用法） |

###### **实际应用详解**

| 场景                                   | 推荐值       | 说明                           |
| -------------------------------------- | ------------ | ------------------------------ |
| Web 服务、Tomcat、Nginx 等长期运行服务 | `always`     | 稳定性第一，随时挂了都要拉起   |
| 容易因配置异常退出的服务               | `on-failure` | 防止配置错误反复重启，浪费资源 |
| 一次性任务（备份脚本等）               | `no`         | 不需要重启                     |

##### [Install] 段

| 项目                         | 是否必须 | 说明                                         |
| ---------------------------- | -------- | -------------------------------------------- |
| `WantedBy=multi-user.target` | 必须     | 表示系统正常运行级别下启用该服务（开机自启） |

------

#### 启用服务的操作命令

```bash
# 1. 重新加载 systemd 配置
sudo systemctl daemon-reload

# 2. 启动并设置开机自启
sudo systemctl start tomcat9
sudo systemctl enable tomcat9

# 3. 查看服务状态
sudo systemctl status tomcat9
```

------

#### 日志查看与调试

```bash
# 实时查看服务日志输出
journalctl -u tomcat9 -f

#journalctl 是 systemd 日志的查询工具，核心是过滤和查看。
#通过 -u、-f、-n 等选项快速定位服务或系统问题。
#调试服务时，先用 journalctl -u 查看错误，再根据需要加时间或优先级过滤。

# 查看错误日志
journalctl -xe

# 停止和禁用服务
sudo systemctl stop tomcat9
sudo systemctl disable tomcat9
```

#### 常见问题排查建议

| 问题             | 排查方向                                   |
| ---------------- | ------------------------------------------ |
| 启动失败         | 检查日志（journalctl、catalina.out）       |
| 无日志输出       | 检查用户权限，脚本是否可执行               |
| 找不到 JAVA_HOME | 明确写入 `Environment=JAVA_HOME=...`       |
| 权限不足         | 检查 tomcat 文件夹权限是否允许指定用户访问 |

------

#### 最简版服务文件（不推荐生产使用）

```ini
[Unit]
After=network.target

[Service]
Type=forking
ExecStart=/home/motor/tomcat9/bin/startup.sh
ExecStop=/home/motor/tomcat9/bin/shutdown.sh

[Install]
WantedBy=multi-user.target
```