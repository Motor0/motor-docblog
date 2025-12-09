# AWK

**一种用于处理文本的编程语言和工具，特别适合处理结构化数据（如表格、日志文件）**

**处理文件内容**

**核心理念**

- **模式-动作**（Pattern-Action）：awk 基于“匹配模式后执行动作”的逻辑。

- **行处理**：awk 默认按行读取输入文件，每行被分割成字段（fields）。

- **字段分割**：每行按分隔符（默认是空格或制表符）分割为字段，分别用 $1, $2, ... 表示。

- **内置变量**：awk 提供丰富的内置变量（如 NF, NR, FS）来简化操

**核心逻辑**

```shell
for ((每行文本));do
    if [匹配某个模式];then
        执行对应的动作;
    fi
done
```

​	模式可以是正则表达式、条件表达式，或者干脆啥也不写（默认全匹配）；动作可以是打印、计算、修改文本等。

**使用场景**

- **数据提取**：从日志、CSV 等文件中提取特定字段或行。

- **数据转换**：格式化输出、统计汇总。

- **简单报表生成**：如统计、计数、求和。

- **自动化脚本**：结合 shell 脚本处理文本。

### 基本语法

```bash
awk [选项] 'pattern { action }' 文件
```

- **选项**：如 -F 指定分隔符。

- **pattern**：匹配条件（如正则表达式或逻辑表达式），省略则匹配所有行。示例：(先匹配上，再执行动作)

  ```bash
  ps aux | awk '$3 > 1.0 {print $2, $11}'
  # 找出 CPU 使用率大于 1% 的进程 PID 和命令
  ```

- **action**：执行的操作（如 print, printf），用大括号 {} 包裹。

  - **{action} 是匹配后要执行的动作（如 print, printf, next, 等）；但如果你只写了 pattern 而没有 action，awk 默认就会执行 {print}-->也就是打印所有匹配到的行。**

    ```bash
    #保留第一行 或者 保留所有使用率超过 80% 的磁盘分区
    df -h | awk 'NR==1 || $5+0 > 80'
    ```

    - **` $5+0`**这种写法是为了**强制将字段 `$5` 的值转换为数字（Numeric）类型** ，从而避免因为字符串比较而带来的错误。

- **文件**：**输入文件，省略则从标准输入读取。**

### 工作流程

1. **初始化**：读取命令行选项和脚本，设置内置变量（如 FS）。
2. **逐行处理：**
   - 读取一行，分割为字段。
   - 检查是否匹配 pattern，若匹配则执行对应的 action。
3. **结束**：处理完所有行后，执行 END 块（如果有）。

**伪代码逻辑**

```bash
BEGIN {
    # 初始化变量、打印表头等
}

{
    # 对每一行执行：$0 是整行，$1, $2... 是字段
    # 这里是主处理逻辑
}

END {
    # 最后汇总、打印统计结果等
}
```

### 关键组成

1. **字段：**

   - **$0**：当前一整行的内容(没有指定某个行数之前，会遍历整个文件，除非指定某一行)

     - **和$1的区别，实际上是可以看出来的**

     ```shell
     cat data.txt |awk 'NR==1 {print$0}'
     cat data.txt |awk 'NR==1 {print$1}'
     ```

   - **$1, $2, ...**：第 1、第 2 个字段。

   - **NF**：总字段数。

2. **内置变量：**

   - **NR**：当前行号（全局）。**FNR**：当前文件的行号。
     - **两者的区别**
       - **AWK 处理多个文件时会把它们当作一个连续的整体来处理**，并且在整个过程中，`NR`（总行号）一直递增；而 `FNR` 就会读取到新的一个文件时会重新计数
   - **FS**：输入字段分隔符（默认空格/制表符）。
   - **OFS**：输出字段分隔符（默认空格）。
   - **RS**：输入记录分隔符（默认换行符）。
   - **ORS**：输出记录分隔符（默认换行符）。
   - **FIENAME：**获取文件名称

3. **特殊块：**

   - **BEGIN {}**：在处理任何行之前执行一次，常用于初始化。

     - **执行时机**：在 AWK 开始读取输入文件之前（即 `{action}` 主循环之前）。

     - **典型用途**：初始化变量、打印表头、设置分隔符等准备工作。

     - **格式化输出示例**

       ```bash
       BEGIN { OFS="\t"; print "Name", "Age" }
       { print $1, $2 }
       
       #BEGIN有打印，首先会打印 第一行 Name(一个 Tab空格位置)Age
       ```

   - **END {}**：在处理所有行之后执行一次，常用于汇总

#### **声明变量**

​	**在 `awk` 中，变量不需要预先声明，且未初始化的变量会自动初始化为 `0` 或空字符串（取决于上下文）。因此，求和时可以直接使用 `sum+=$1` 而无需显式初始化 `sum=0`。**

### 操作示例

#### 字符串操作

常见函数：

- `length($1)`：字符串长度
- `substr($1, 2, 3)`：从第 2 个字符开始，取 3 个
- `index($1, "abc")`：找子串位置
- `tolower($1)`、`toupper($1)`：大小写转换
- `split($1, arr, ",")`：按逗号分隔存到数组 arr

例子：

```bash
echo "Tom,20,Beijing" | awk -F, '{print toupper($1), length($3)}'
```

##### 拼接

- **基本拼接**

  ```bash
  awk 'BEGIN{
  	a="Hello"
      b="World"
      print a b      # 输出 HelloWorld
      print a " " b  # 输出 Hello World
  }'
  ```

- **拼接和变量展开**

  可以吧字符串常量和变量混合

  ```bash
  awk 'BEGIN{
      name="Tom"
      print "Hello, " name "!"
  }'
  ```

- 拼接和数组下标

  ```bash
  echo -e "Tom Math 90\nTom English 80\nJerry Math 70" \
  | awk '{ score[$1 "-" $2] = $3 }
         END{ for(k in score) print k, score[k] }'
  
  #[$1 "-" $2] 就是把 $1 和 "-" 和 $2 拼在一起作为键。
  #数组内容：
  score = {
    "Tom-Math": 90,
    "Tom-English": 80,
    "Jerry-Math": 70
  }
  ```

#### 基本常用

```shell
#打印所有
awk '{print $0}' baota.txt 
#打印特定字段，由于未指定正确的分隔符，它会把整行内容当作一个字段（因为该行没有空白字符分隔出多个字段），所以 $1 就是整行内容 
awk '{print $1,$3}' baota.txt

#设置输入分割符(如冒号)
awk -F':' '{print $1}' /etc/passwd

#设置输出分隔符 | |
sudo awk -F':' 'BEGIN { OFS="| |" } {print $1,$2}' /etc/shadow
    #还可以这样写
    #FS=":"：输入分隔符改为冒号（解析 /etc/passwd）。
    #OFS="|"：输出分隔符改为竖线（生成格式化的结果）。
    awk 'BEGIN {FS=":"; OFS="|"} {print $1, $6} END{print "总共有", NF, "列"}' /etc/passwd
```

##### 统计与计算

这是访问日志：192.168.31.228.log

```shell
#查看出现过的 IP
awk '{print $1}' 192.168.31.228.log | sort | uniq -c |sort -r
```

- `awk '{print $1}'`：提取日志文件中的第一列（一般为 IP 地址）。

- `sort | uniq -c`：对 IP 地址进行排序并统计出现次数。

- `sort -nr`：按出现次数降序排列。

##### 条件匹配

```shell
#匹配五月 四点到六点之间哪个ip访问过，并统计次数
awk '/\[09\/May\/2025:(1[6-8]):[0-5][0-9]:[0-5][0-9]/ {print $1}' 192.168.31.228.log | sort |uniq -c|sort -nr
```

##### **error的日志提取**

```shell
#筛选 2025/05/09 16:00 - 17:00 的所有错误日志
awk '/2025\/05\/09 16:[0-5][0-9]:[0-5][0-9]/ {print $2,"-",$NF}' 192.168.31.228.error.log
#统计包含error的行数
awk '/error/ { count++ } END { print "Errors:", count }' 192.168.31.228.error.log
#筛选包含 Undefined variable 错误的日志
awk '/Undefined variable/ {print $11, "-", $2}' 192.168.31.228.error.log
#筛选 16:00 - 18:00 时间段内，错误请求的 URL 路径
awk '/2025\/05\/09 (1[6-8]):[0-5][0-9]:[0-5][0-9]/ {print $15, "-", $2}' error.log
```

#### 输出方式

##### 普通输出

```bash
awk '{print $1,$2}'
```

##### 格式化输出

**并且不换行**

```shell
awk '{printf "Name: %-10s Age: %d\n", $1, $2}' data.txt
#%-10s 表示左对齐、占 10 字符宽度。
```

#### 多文件处理

##### 前置知识

**`FILENAME` 是一个内置变量。`awk` 会自动识别并为其赋值，它代表当前正在处理的文件名。**

**`FILENAME` 的赋值**

- 每当 `awk` 开始处理一个新文件时，它会自动将 `FILENAME` 设置为该文件的名称。在处理文件的过程中，`FILENAME` 的值保持不变，直到处理完当前文件并开始处理下一个文件，此时 `FILENAME` 会更新为新文件的名称。

```bash
#处理多个文件，打印文件名和每行内容
awk '{ print FILENAME, $0 }' file1.txt file2.txt

#区分文件
awk 'FNR==1 { print "Processing", FILENAME } { print $0 }' file1.txt file2.txt

#判断是否是第一个文件的第一行
awk 'FNR == 1 {print "新文件开始:", FILENAME} { ... }' file1.txt file2.txt

#比较两个文件的内容（比如找出在第一个文件中存在但不在第二个中的行）
#如果 $0 in a 是 true（即当前行存在于数组中），那么 !($0 in a) 就是 false

#'如果 $0 in a 是 false（即当前行不在 数组中），那么 !($0 in a) 就是 true
awk 'NR == FNR { a[$0]; next } !($0 in a)' file1 file2

#合并多个 CSV 文件，并且 只保留 第一个文件的标题行（第一行），其余文件跳过各自的标题行 当前目录下所有的csv文件
awk 'FNR > 1 || NR == 1' *.csv > merged.csv
```

###### **`next` 控制流语句**

当你在某个 pattern { action } 块中使用 next 时：

- AWK 会 停止对当前行的进一步处理
- 跳过当前块中后面的代码
- 立即读取下一行输入，并从头开始匹配规则

#### 内置函数

- **字符串函数**

  - `length(str)`：返回字符串长度。

    `substr(str, start, len)`：提取子字符串。

    `gsub(regex, replacement, str)`：全局替换。

  ```shell
  awk '{ gsub(/error/, "ERROR"); print }' log.txt
  ```

- **数学函数**：

  - int(x)：取整。
  - sqrt(x)：平方根。

## 循环与数组

### 数组（Associative Arrays）

AWK 的数组本质是 **关联数组**（键值对），所以长得像字典：`{key: value}`。

#### AWK 数组和普通数组的区别

在 C / Java 里：

- 数组必须声明长度
- 下标只能是整数（0,1,2...）

在 **AWK** 里：

- 数组是 **关联数组（associative array）**

- 下标可以是字符串，不限于数字

- 不需要声明，**用到时自动创建**

  这就是为什么能写：

  ```bash
  count["apple"]++
  ```

  而不用管有没有 `count["apple"]`，**AWK 会自动假设它初始值是 0。**

#####  “关联”的意思

**关联数组** = 键值对存储（类似 Python 的 dict，或 JS 的对象）。

**例子**

```bash
#这里 "Tom"、"Jerry" 就是键，不需要数字索引。
a["Tom"] = 90
a["Jerry"] = 75
#输出顺序不固定（因为是哈希存储）。
for (k in a) {
    print k, a[k]
}
```

##### 数字索引也行

虽然键通常用字符串，但数字也能用：

```bash
arr[1] = "hello"
arr[100] = "world"
```

注意：

- 下标 `1` 和 `"1"` 在 AWK 里 **会被当作同一个键**（都会转成字符串 `"1"`）。
- 所以 AWK 没有“真正的连续数组”，都是字符串键的哈希表。

##### 没有索引时 怎么办

- **访问不存在的元素**

  ```bash
  print a["xxx"]
  ```

  返回空字符串 `""`,如果数字用就是 `0`

  所以 `count['xxx']++ `等价于 `count["xxx"]=0+1` → 自动初始化为 1。

- **遍历时只遍历已存在的键**

  ```bash
  for (k in a) print k, a[k]
  #不会打印没赋值的。
  ```

- **判断一个键是否存在**

  ```bash
  if ("Tom" in a) { print "Tom exists" }
  ```

#### **经典例子：**

##### 统计单词频率

```bash
echo "apple orange apple banana orange apple" \
| awk '{for(i=1;i<=NF;i++) count[$i]++}
       END{for(k in count) print k,count[k]}'
```

输出类似：

```bash
orange 2
banana 1
apple 3
```

##### **分组求和**

```bash
# score.txt
# Tom Math 90
# Tom English 80
# Jerry Math 70
# Jerry English 60

awk '{score[$1]+=$3}
     END{for(name in score) print name,score[name]}' score.txt
     #“AWK 的数组像字典，不像列表；不存在的元素默认是 0/空串。
     #处理完就是 score = {
  "Tom": 170,
  "Jerry": 130
  ...
}
```

###### 拓展

> - score[$1] += $3` 等价于 `score[$1] = score[$1] + $3
>
> - 如果 `score[$1]` 之前没有值，AWK 会自动当作 **0** 来处理
>
> ```bash
> echo -e "Tom Math 90\nTom English 80" \
> | awk '{score[$1]+=$3} END{for(name in score) print name,score[name]}'
> ```
>
> 执行过程：
>
> - 第一行：`score["Tom"] = 0 + 90 = 90`
> - 第二行：`score["Tom"] = 90 + 80 = 170`

## 使用场景和示例范围

#### 日志分析

**需求**：提取 Apache 日志中状态码为 404 的请求。

```shell
awk '$9 == 404 { print $7 }' access.log
```

提取第 9 字段（状态码）为 404 的第 7 字段（URL）。

#### CSV 处理

**需求**：从 CSV 文件提取特定列并重新格式化。

```shell
awk -F',' 'BEGIN { OFS="|" } { print $1, $3 }' data.csv
```

将 CSV 的第 1 和第 3 列用 | 分隔输出。

#### 数据统计

**需求**：统计文件中每一列的平均值。

```shell
awk '{ for(i=1; i<=NF; i++) sum[i]+=$i } END { for(i=1; i<=NF; i++) print "Column", i, "Avg:", sum[i]/NR }' data.txt
```

#### 文本清洗

**需求**：将文件中所有 "http://" 替换为 "https://"。

```shell
awk '{ gsub(/http:\/\//, "https://"); print }' urls.txt
```

#### 结合 shell 脚本

**需求**：统计当前目录下文件的行数。

```shell
ls | xargs awk 'END { print FILENAME, NR }'
```

**`xargs`能够从标准输入（通常通过管道`|`获取）读取数据，将这些数据按照一定规则进行分割，然后将分割后的内容作为参数传递给其他命令。**

## 正则进阶

##### 基本组成

- **字面字符**：直接匹配字符，如 abc 匹配字符串 "abc"。

- **还有一个量词-控制匹配次数**

- **元字符**

  - | 元字符  |                含义                |    举例     |             匹配内容             |
    | :-----: | :--------------------------------: | :---------: | :------------------------------: |
    |   `.`   |   匹配任意一个字符（除了换行符）   |   `/a.c/`   |         abc, a2c, a c 等         |
    |   `^`   |         匹配**开头**的位置         |  `/^abc/`   |        行首是 "abc" 的行         |
    |   `$`   |         匹配**结尾**的位置         |  `/abc$/`   |        行尾是 "abc" 的行         |
    |   `*`   |    前面的字符出现**0次或多次**     | `/go*gle/`  |     ggle, google, gooogle 等     |
    |   `+`   |    前面的字符出现**1次或多次**     | `/go+gle/`  | google, gooogle（但不包括 ggle） |
    |   `?`   |     前面的字符出现**0次或1次**     | `/go?gle/`  |   ggle, google（但最多一个 o）   |
    |  `[]`   |    匹配括号中的**任意一个字符**    | `/[aeiou]/` |       匹配任意一个元音字母       |
    |  `[^]`  |   不匹配括号中的**任意一个字符**   | `/[^0-9]/`  |        匹配不是数字的字符        |
    | `[a-z]` |     匹配一个范围（如小写字母）     |  `/[a-z]/`  |         任意一个小写字母         |
    |   `\`   | 转义字符（把特殊字符变成普通字符） |  `/\.com/`  |  匹配 ".com"（而不是任意字符）   |
    |  `()`   |      分组（用于组合多个字符）      |  `/(ab)+/`  |       ab, abab, ababab 等        |
    |   `|`   |     或者（注意前面有个反斜杠）     | `/cat|dog/` |         匹配 cat 或 dog          |

- **转义**：用 \ 转义元字符，如 \. 匹配点号本身。

**正则表达式位置**：

- **直接用在模式部分**：`/regex/，如 awk '/error/ { print }' file.txt。`
- **用在条件中**：`$n ~ /regex/，匹配第 n 个字段，如 awk '$1 ~ /^[0-9]+$/ { print }' file.txt。`
- **用在函数中**：如 `gsub(/regex/, replacement, str)。`

**算符**：

- `~`：匹配正则，如 `$1 ~ /abc/`。
- `!~`：不匹配正则，如 `$1 !~ /abc/`。

**分隔符**：

- 正则表达式需要用 `/` 包裹，如 `/[0-9]+/`。
- 如果正则中包含 `/`，需转义或用其他方式（如字符串形式）。

**大小写敏感**：默认大小写敏感，可用 `IGNORECASE=1（GNU awk）`忽略大小写。

###### 关于转义

​	在 awk 正则表达式中，某些字符具有特殊含义（如元字符 ., *, /），如果想让这些字符表示字面意义（即本身），需要用反斜杠 \ 进行转义。**避免元字符被解析为正则操作**

​	**当需要将正则元字符(如`.,*,+,?,|,(),[],{},^,$`等)转换为本身的字面值（输入什么输出就是什么，不会被awk正则解析）的时候就需要，比如：）**

**示例**

- 匹配 URL 中的斜杠（如` http://`）：需写为` http:\/\/`。

**场景**

files.txt内容

```shell
report.txt
data.csv
notes.txt
log.file
```

**匹配包含点号的文件扩展名**

- **正确使用**

  ```shell
  awk '/\.txt$/ { print }' files.txt
  #正则表达式 /\.txt$/：
  #\.：转义点号，匹配字面 .。
  #txt：匹配字面 "txt"。
  $：确保匹配行尾。
  ```

- **不使用转义**

  ```shell
  awk '/[.]txt$/ { print }' files.txt
  #输出
  report.txt
  notes.txt
  log.file
  ```

  **错误原因**：

  - .txt$：. 匹配任意字符，导致 "log.file"（以任意字符后跟 "txt" 或其他）也被匹配。
  - 结果包含非预期的 "log.file"，因为 . 未被转义为字面点号。