# 日志管理

## 前置知识

**日志**是 Linux 日常运维和排错的“黑匣子”。我们就以 **Ubuntu (systemd 系统)** 为例

首先要理解一个观念：现代 Linux (尤其是使用 systemd 的，比如 Ubuntu 16.04+)，日志系统发生了“革命性”的变化。

- **过去的方式**：所有程序都往 `/var/log/` 目录下的各种文本文件（如 `syslog`, `auth.log`）里扔日志。管理混乱，格式不一，查询困难。
- **现代的方式**：系统里有一个“日志大管家”名叫 `systemd-journald`。所有的系统服务和应用产生的日志，都会先被集中送到它这里。它以一种高效、结构化的二进制格式存储日志，查询起来又快又准。

 基础概念：日志是什么，为什么重要？

- **日志的定义**：Linux日志是系统、内核、应用和服务产生的记录文件，通常以文本形式存储事件、错误、警告和调试信息。它们像“黑匣子”一样记录系统行为。
- 为什么重要：
  - **故障诊断**：快速定位崩溃或错误（如服务启动失败）。
  - **安全审计**：检测入侵尝试（如SSH登录失败）。
  - **性能监控**：分析资源使用（如CPU高负载日志）。
  - **合规性**：许多法规（如GDPR）要求保留日志。
- 日志的位置：大多数日志存储在 **`/var/log/`**目录下，例如：
  - /var/log/syslog：通用系统日志。
  - /var/log/auth.log：认证相关（如登录）。
  - /var/log/kern.log：内核日志。
  - /var/log/dmesg：引导时设备信息（用dmesg命令查看）。
- **日志级别**（优先级）：基于syslog标准，从低到高包括debug、info、notice、warning、err、crit、alert、emerg。日志系统会根据级别过滤和路由消息。

现代Linux的日志系统有两种主流：

- **传统syslog-based**：如rsyslog（默认在许多Debian系）或syslog-ng（更灵活的配置）。
- **systemd-journald**：集成在systemd中，提供二进制日志存储，支持富元数据（如进程ID、用户），更高效但不易手动编辑。

#### 核心组件和工具

- **systemd-journald**：现代默认日志守护进程（daemon）。它收集所有日志到二进制文件（/run/log/journal/或/var/log/journal/），支持查询和持久化。
- **rsyslog**：处理syslog消息，支持远程日志、过滤和模块化配置。配置文件在/etc/rsyslog.conf和/etc/rsyslog.d/。
- **logrotate**：日志轮转工具，用于压缩、归档和删除旧日志，防止磁盘满。配置文件在/etc/logrotate.conf和/etc/logrotate.d/。
- 其他工具：
  - journalctl：查询journald日志。
  - tail、grep、less：手动查看文本日志。
  - systemctl：管理服务日志。

## Ubuntu 中的日志类型

|              |                       |                         |
| ------------ | --------------------- | ----------------------- |
| **系统日志** | `/var/log/syslog`     | `rsyslog`服务           |
| **内核日志** | `/var/log/kern.log`   | 内核（kernel）          |
| **认证日志** | `/var/log/auth.log`   | 登录、sudo、SSH         |
| **应用日志** | `/var/log/`下的子目录 | Nginx、MySQL、Apache 等 |
| **启动日志** | `journalctl`          | `systemd`（现代方式）   |

## 基本使用

- **查看所有日志**

  `sudo journalctl`

- **查看最近的日志**

  `sudo journalctl -n 50`

- **实时监控日志**

  `sudo journalctl -f` 

- **按时间查看**

  ```bash
  sudo journalctl --since today
  sudo journalctl --since "2025-04-05 10:00"
  sudo journalctl --until "2025-04-05 12:00"
  sudo journalctl --since yesterday --until now
  ```

### 场景使用

#### Nginx 网站挂了，怎么回事？

- **先查看服务状态**(这个命令的输出末尾通常会直接显示几行最新的相关日志，很多时候问题在这里就能看出来。)

  `systemctl status nginx.service`

- **深入挖掘日志：如果状态信息不够，我们就用 `journalctl` 专门查看 Nginx的日志**

  ```bash
  # -u (unit) 表示指定服务单元
  # -e (end)  表示直接跳到日志的末尾，最新的信息总是在末尾
  journalctl -u nginx.service -e
  ```

  > 这个命令会把 Nginx 从启动到现在的所有日志都给你，并且光标停在最后一行，方便你向上翻阅。比 `tail -f /var/log/nginx/error.log` 强大多了，因为它包含了 `error` 和 `access` 的所有信息，以及服务启动失败的底层原因。

- **实时监控日志**：如果你想看实时的日志流（比如观察用户访问或排查一个正在发生的问题），使用 `-f` 参数。

  ```bash
  # -f (follow) 实时跟踪新日志
  journalctl -u nginx.service -f
  ```

#### 服务器好像变慢了，是不是有什么异常？

- **查看今天的所有“错误”或更高级别的日志**：

  ```bash
  # -p (priority) 指定日志级别，可以是 err, warning, notice, info, debug
  # --since "today" 指定时间范围
  journalctl -p err --since "today"
  ```

- **查看过去一小时的所有日志**：

  ```bash
  journalctl --since "1 hour ago"
  ```

  这在你刚刚发现问题，需要回溯不久前的事件时特别有用。你甚至可以用精确的时间，例如 `--since "2025-08-30 14:30:00"`。

- **查看内核日志**：有时候硬件或驱动问题会导致系统异常。

  ```bash
  # -k (kernel) 专门查看内核日志
  journalctl -k -e
  ```

#### 登录方面ssh

- **查看 ssh 服务的日志**

  ```bash
  journalctl -u ssh.service --since yesterday --until today
  ```

  

- **在传统日志文件中查找**： 虽然 `journalctl` 很强大，但对于安全审计，很多管理员还是习惯看 `/var/log/auth.log`。这个文件专门记录认证和授权相关的事件。`journald` 会把 sshd 的日志转发一份到这里.

  ```bash
  # 用 grep 在传统日志文件中搜索失败的登录尝试
  grep "Failed password" /var/log/auth.log
  ```

  **重点**：你会发现，`journalctl -u ssh` 看到的内容和 `auth.log` 里的高度相关。这就是现代日志系统的协作模式：`journald` 收集，`rsyslog` (另一个服务) 负责把 `journald` 的日志分类写入到 `/var/log/` 的文本文件中。

### 日志的持久化

Ubuntu Server 可能将日志存储在 `/run/log/journal/`，这是一个临时目录，**系统重启后日志就全没了！**

**检查你的日志存储方式**：

```bash
ls /var/log/journal
```

- 如果这个目录**不存在**，那么你的日志就是临时的。

- 如果这个目录**存在**，那么日志就是持久化的。



**开启持久化存储**（如果尚未开启）： 非常简单，只需要创建那个目录，`journald` 会自动识别并使用它。

```bash
sudo mkdir -p /var/log/journal
```

然后重启 `journald` 服务（或者直接重启系统），它就会开始将日志写入硬盘。

```bash
sudo systemctl restart systemd-journald
```



**管理日志大小**： 持久化之后，日志会不断增长，占满硬盘。我们需要配置它的大小限制。编辑配置文件：

```bash
sudo nano /etc/systemd/journald.conf
```

找到并取消注释（去掉前面的`#`）以下两行，并修改为你需要的大小：

```Ini, TOML
[Journal]
SystemMaxUse=1G
```

这表示日志文件总大小最多占用 1GB。修改后，同样需要重启服务。

### 记录脚本日志-融入系统

假设你写了一个定时执行的备份脚本，你也希望它的运行日志能被 `journalctl` 管理起来。

使用 `logger` 命令，你可以非常方便地将自定义信息发送给`journald`。

在你的脚本里，可以这样用：

```bash
#!/bin/bash

# 脚本开始时记录一条信息
logger "Backup script started."

# ... 执行你的备份逻辑 ...
if [ $? -eq 0 ]; then
    # 成功后记录一条信息
    logger "Backup completed successfully."
else
    # 失败后记录一条错误信息，并加上标签-t
    logger -t backup_script "Backup failed with error code $?."
fi
```

然后，你就可以像查询系统服务一样查询你的脚本日志了：

```bash
# -t (tag) 使用你指定的标签来查询
journalctl -t backup_script
```

## 工具的使用时机

​	**`journalctl` = 系统和服务的“健康档案”**：它关心的是操作系统的底层、硬件、以及由 `systemd` 管理的各个服务的“生死存亡”和“状态报告”。

​	**传统日志文件 (`/var/log/\*.log`) = 应用程序的“工作笔记”**：它关心的是应用程序内部的业务逻辑、详细的访问记录、具体的错误堆栈等。

#### 什么时候应该优先使用 `journalctl`？

`journalctl` 是排查 **“系统级”** 和 **“服务管理级”** 问题的首选。

1. **服务启动/停止/重启失败**
   - **场景**：“我用 `systemctl start nginx` 启动 Nginx，结果失败了！”
   - **为什么用 `journalctl`**：`systemctl` 启动服务的整个过程，包括为什么失败，都被 `systemd` 完整记录在案。这些信息是 **最原始、最底层** 的，普通的应用日志文件里根本看不到。
   - **命令**：`journalctl -u nginx.service -e`
2. **系统启动与关机问题**
   - **场景**：“服务器上次重启好像特别慢，我想知道卡在哪里了。”
   - **为什么用 `journalctl`**：只有 `journald` 从系统启动的最初几秒就开始记录日志，包括内核加载、硬件初始化等。这些信息在任何其他地方都找不到。
   - **命令**：`journalctl -b -1` (查看上一次启动的日志)
3. **硬件、驱动或内核级别的错误**
   - **场景**：“我插上一个 U 盘，系统没反应。” 或者 “系统日志里出现了很多红色的 I/O error。”
   - **为什么用 `journalctl`**：内核 (`kernel`) 和硬件驱动直接与 `journald` 通信。
   - **命令**：`journalctl -k -p err` (只看内核的错误日志)
4. **需要跨服务、全局性地排查问题**
   - **场景**：“今天下午3点左右，网站突然出现大量502错误，我想知道那个时间点整个系统发生了什么？是不是数据库崩了，或者内存满了？”
   - **为什么用 `journalctl`**：`journalctl` 最大的优势是**集中化**和**精确到微秒的时间戳**。你可以轻松地拉取一个特定时间窗口内，所有服务（Nginx, MySQL, Redis...）的日志，把它们按时间线串起来分析，从而找到问题的根本原因。这是翻阅多个分散的文本日志文件无法高效完成的。
   - **命令**：`journalctl --since "2025-08-30 15:00:00" --until "2025-08-30 15:05:00"`
5. **用户登录与权限问题**
   - **场景**：“我想看看最近有谁通过 SSH 登录了服务器。”
   - **为什么用 `journalctl`**：用户认证（比如通过 `sshd`）是由系统服务管理的，其日志会被 `journald` 捕获。
   - **命令**：`journalctl -u sshd` (这部分日志也通常会被转发到 `/var/log/auth.log`)

#### 什么时候 `journalctl` 帮不上忙，或不是最佳选择？

当你需要关心 **“应用程序内部的详细逻辑”** 时，`journalctl` 就不够用了。

1. **分析 Web 服务器的访问日志**
   - **场景**：“我想统计一下哪个 IP 地址访问我的网站最频繁？” “我想分析所有访问返回 404 的 URL 是哪些？”
   - **为什么不用 `journalctl`**：这些详细的 HTTP 请求信息（IP、URL、User-Agent、响应时间等）被 Nginx/Apache 精心格式化后，专门记录在 `access.log` 文件里。`journalctl` 里只有“Nginx启动了”、“Nginx进程被杀了”这类服务状态信息，没有具体的业务访问信息。
   - **应该查什么**：`/var/log/nginx/access.log` 或 `/var/log/apache2/access.log`
2. **应用程序的 Debug 和错误堆栈**
   - **场景**：“我的 Python/Java/Node.js 应用程序崩溃了，我要看具体的代码出错在哪一行。”
   - **为什么不用 `journalctl`**：应用程序内部的 `try...catch` 块捕获的异常、详细的函数调用栈（Stack Trace）等，通常被配置为输出到应用自己的日志文件中。
   - **应该查什么**：你应用自己配置的日志文件，例如 `/home/myuser/app/logs/app.log` 或 `/var/log/tomcat/catalina.out` 等。
3. **数据库的慢查询分析**
   - **场景**：“网站接口响应很慢，我想知道是哪条 SQL 语句拖累了数据库。”
   - **为什么不用 `journalctl`**：MySQL/PostgreSQL 的慢查询日志有自己特定的格式，记录了执行时间、执行用户、具体SQL语句等，需要开启并查看其专用日志文件。
   - **应该查什么**：MySQL 的 `slow-query.log` 文件。

### `journalctl` 到底能查什么相关的日志？

`journalctl` 能查询所有**写入到 Journal 日志系统**的日志。这主要包括：

1. **内核日志 (Kernel messages)**。
2. **系统服务日志**：所有通过 `systemd` 管理的服务的 `stdout` (标准输出) 和 `stderr` (标准错误输出)。这是最主要的部分。
3. **用户进程日志**：任何用户通过 `logger` 命令或 `systemd-cat` 工具手动发送的日志。
4. **系统启动过程日志 (initrd, early boot)**：这是 `journalctl` 的独占优势，这些极早期的日志在其他地方找不到。