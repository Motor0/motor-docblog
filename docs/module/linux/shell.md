## shell脚本的执行方式

看菜鸟教程

[阮一峰blog也不错](https://wangdoc.com/bash/intro)

- 脚本格式要求

  - 脚本以`#!/bin/bash`开头
  - 脚本需要有执行权限

- 脚本的常用执行方式

  - 方式1 (输入脚本的绝对路径或相对路径)

  - 方式2 (sh+脚本)

    说明：不用赋予脚本+x权限，直接执行即可

```shell
#!/bin/bash
echo 'Hello World!!!!!!!!!!!!!'
```

## 变量介绍

1. Linux shell中的变量分为，系统变量和用户自定义变量
2. 系统变量：$HOME、$PWD、$SHELL、$USER等
3. 显示当前shell中所有的变量: set

**shell变量的定义**

- 规则

1. 变量名称可以由字母、数字和下划线组成，但是不能以数字开头
2. 等号两侧不能有空格
3. 变量名称一般习惯为大写，这是一个规范，变量名称一般不会使用系统变量来进行命名（比如：**PATH**,使用的时候就变成了 **$PATH**这样子很危险）
4. 注意，**不要以系统变量命名**

##### 拓展

###### printf

```shell
printf  format-string  [arguments...]
#format-string: 一个格式字符串，它包含普通文本和格式说明符。
arguments: 用于填充格式说明符的参数列表。。
#%s：字符串
#%d：十进制整数
#%f：浮点数
#%c：字符
#%x：十六进制数
#%o：八进制数
#%b：二进制数
#%e：科学计数法表示的浮点数

#!/bin/bash
# author:菜鸟教程
# url:www.runoob.com
 #####
 #%-10s 指一个宽度为 10 个字符（- 表示左对齐，没有则表示右对齐），任何字符都会被显示在 10 个字符宽的字符内，如果不足则自动以空  格填充，超过也会将内容全部显示出来。
 #%-4.2f 指格式化为小数，其中 .2 指保留 2 位小数。
 #####
printf "%-10s %-8s %-4s\n" 姓名 性别 体重kg  
printf "%-10s %-8s %-4.2f\n" 郭靖 男 66.1234 
printf "%-10s %-8s %-4.2f\n" 杨过 男 48.6543 
printf "%-10s %-8s %-4.2f\n" 郭芙 女 47.9876
```

#### 将命令的返回值赋给变量

**直接写命令的话，它就会执行命令，毕竟是个shell脚本**

- **A=\`data`反引号,运行里面的命令，并把结果返回给变量A**
- **A=$(date) 等价于反引导**

```shell
#!/bin/bash
#将命令的内容进行输出
echo $(du -h $file | awk '{print $1}')

#例如时间格式
`date +%Y%m%d—%H:%M:%S` #或
$(date +%Y%m%d—%H:%M:%S)

#-exec command {} \;：对搜索结果执行指定命令，{} 代表找到的文件。
#查找 /tmp 目录下所有超过 7 天 前被访问过的文件
file /temp -atime +7 -exec rm -rf {} /
```

#### 变量的替换和拓展

`${}`主要用于**变量替换和扩展**

- **获取变量值**：**`${变量名}`与`$变量名`作用相同，用于获取变量的值。**

- **精确界定变量名范围**：**当变量名与其他字符相邻时，`${}`可以明确变量的边界。**

  如果不使用`${}`，会尝试获取名为`nameDoe`的变量。

  ```shell
  name="John"
  echo "My name is ${name}Doe"   # 输出：My name is JohnDoe
  ```

### shell变量的定义

**没有数据类型的划分，所有都是字符串类型**

```shell
#!/bin/bash
#定义变量
word='Hello'
#撤销变量
unset word
#声明静态变量：readonly变量，注意：不能unset
```

```shell
#定义变量A
A=666
echo $A
echo A=$A
#撤销变量A
unset A
#声明静态的变量B=2，不能unset
readonly B=2
#可把变量提升为全局环境变量，可供其他shell程序使用
```

#### 数组

- 直接定义：可以通过指定索引来定义数组元素。

  ```bash
  arr[0]="first"
  arr[1]="second"
  ```

- 批量定义：也可以一次性定义所有元素。

  ```bash
  arr=("first" "second" "third")
  ```

- 定义访问遍历删除 及修改

  ```bash
  #!/bin/bash
  # 定义数组
  colors=("red" "green" "blue")
  
  # 访问第一个元素
  echo "First color: ${colors[0]}"
  
  # 获取并打印数组长度
  echo "Total colors: ${#colors[@]}"
  
  # 遍历数组
  echo "All colors:"
  for color in "${colors[@]}"
  do
      echo "$color"
  done
  
  # 添加一个颜色
  colors+=("yellow")
  echo "After adding yellow, total colors: ${#colors[@]}"
  
  # 删除第二个元素
  unset colors[1]
  echo "After removing green, remaining colors:"
  for color in "${colors[@]}"
  do
      echo "$color"
  done
  ```

#### 字符串

- **单引号字符串**：使用单引号`' '`定义，其中的变量和特殊字符不会被解析，会原样输出。**`str='Hello, $name'`**
- **双引号字符串**：使用双引号`" "`定义，其中的变量会被替换，特殊字符（如`\n`、`\t`）会被解析。**`str="hello,$name"`**
- **无引号字符串**：直接赋值，适用于不含空格或特殊字符的简单字符串。**`str=helloworld`**

##### 操作

- **拼接**：直接将字符串连接在一起

  ```bash
  full_name="$first_name $last_name"
  ```

- **获取长度** 使用**`${#变量名}`**获取字符串的长度。

- **截取字符串** 使用**`${变量名:起始位置:长度}`**截取字符串的一部分

- **替换**：使用**`${变量名/旧字符串/新字符串}`**替换第一个匹配的字符串，**`${变量名//旧字符串/新字符串}`**替换所有匹配的字符串。

- **判断包含**：使用`grep`命令或`=~`运算符判断字符串是否包含某个子串。

  ```bash
  if echo "$str" | grep -q "substring"; then
      echo "包含"
  else
      echo "不包含"
  fi
  
  if [[ "$str" =~ "substring" ]]; then
      echo "包含"
  else
      echo "不包含"
  fi
  ```

### 设置环境变量

- 基本语法

  **export 变量名=变量值 （功能描述：将shell变量输出为环境变量/全局变量）**

  **source 配置文件 (功能描述：让修改后的配置信息立即生效)**

  **echo $变量名 (功能描述：查询环境变量的值)**

- 快速入门

  - **在`/etc/profile`文件中定义TOMCAT_HOME环境变量**
  - **查看环境变量 TOMCAT_HOME 的值**
  - **在另一个 shell 程序中使用 TOMCAT_HOME**

  **注意：在输出TOMCAT_HOME 环境变量前，需要让其生效 `source /etc/profile`**

**多行注释**

```shell
#!/bin/bash
: '
A=1000
'
```

### 位置参数变量

 **位置参数允许你在执行脚本时向脚本传递参数，脚本可以根据这些参数做出不同的行为**

**基本语法**

**单个位置参数引用**

- **语法**：`$n`，其中 `n` 是从 1 开始的数字。`$1` 表示传递给脚本的第一个参数，`$2` 是第二个参数，依此类推，直到 `$9`。对于第 10 个及以后的参数，使用 `${n}` 的形式，例如 `${10}` 表示第 10 个参数 。

  - `$0` 代表脚本本身的名称。当你执行一个脚本时，`$0` 的值就是你在命令行中输入的脚本名称，这包括脚本的路径（如果使用了路径来执行脚本）。

    ```shell
    #!/bin/bash
    echo "脚本名称是：$0"
    
    :'
    输出
    '
    脚本名称是：test.sh
    ```

**获取参数个数**

- **语法**：`$#`，这个变量返回传递给脚本的参数的总数。

**所有参数的集合**

- **`$*` 语法**：代表**所有位置参数**，当它被**双引号包围时（`"$*"`），所有参数会被视为一个整体字符串**，以 `IFS`（内部字段分隔符，默认为空格、制表符和换行符）进行分隔。
- **`$@` 语法**：同样代表所有位置参数，但当它被双引号包围时（`"$@"`），每个参数会被视为独立的单词。

```bash
#!/bin/bash
echo "使用 $* 遍历参数:"
for arg in $*; 
do
    echo $arg
done
echo "使用 \"$*\" 遍历参数:"
for arg in "$*"; 
do
    echo $arg
done
echo "使用 \"$@\" 遍历参数:"
for arg in "$@"; 
do
    echo $arg
done

#执行
bash xxx.sh one two three four
: '
输出
'

使用 $* 遍历参数:
one
two
three
使用 "$*" 遍历参数:
one two three
使用 "$@" 遍历参数:
one
two
three

使用 $* 遍历参数:
one
two
three
使用 "$*" 遍历参数:
one two three
使用 "$@" 遍历参数:
one
two
three
```

### 预定义变量

就是shell设计者实现已经定义好的变量，可以直接在shell脚本中使用

**基本语法**

- `$$` （当前进程的进程号(PID)）

- `$!` (后台运行的最后一个进程的进程号（PID）)

  ```bash
  sleep 60 &  # 在后台启动一个睡眠60秒的任务
  background_pid=$!
  echo "后台任务的PID: $background_pid"
  
  #这个脚本启动了一个后台睡眠任务，并记录下其进程 ID，你后续就可以通过这个 PID 来管理该任务。
  ```

- `$?` (表示上一个命令的退出状态码。正常退出状态码为 0，非零状态码表示命令执行过程中出现了错误。不同的非零值代表不同类型的错误，具体取决于命令本身的实现。)

  - ```bash
    ls non_existent_file  # 尝试列出不存在的文件
    echo "上一个命令的退出状态码: $?"
    #执行上述脚本，因为 ls non_existent_file 会失败，所以输出的状态码通常为 2（不同系统可能略有差异）。
    ```

### 运算符 && 条件判断

#### 算术运算符

用于数值的算术运算，主要通过 `$((...))` 或 `let` 命令实现。

- **加法（+）**：`result=$((num1 + num2))` 或 `let result=num1+num2`
- **减法（-）**：`result=$((num1 - num2))`
- **乘法（\*）**：`result=$((num1 * num2))`（在 `let` 中部分系统可能需 `\*` 转义）
- **除法（/）**：`result=$((num1 / num2))` ，结果取整
- **取余（%）**：`result=$((num1 % num2))`
- **自增（++）**：前置 `result=$((++num))` ，后置 `result=$((num++))`
- **自减（--）**：前置 `result=$((--num))` ，后置 `result=$((num--))`

#### 比较运算符

用于数值比较，常用于 `if` 条件判断，使用 `[ 条件 ]` 格式。

- **-eq**：判断两数是否相等，`if [ $num1 -eq $num2 ]; then...`
- **-ne**：判断两数是否不等，`if [ $num1 -ne $num2 ]; then...`
- **-gt**：判断前者是否大于后者，`if [ $num1 -gt $num2 ]; then...`
- **-lt**：判断前者是否小于后者，`if [ $num1 -lt $num2 ]; then...`
- **-ge**：判断前者是否大于等于后者，`if [ $num1 -ge $num2 ]; then...`
- **-le**：判断前者是否小于等于后者，`if [ $num1 -le $num2 ]; then...`

#### 逻辑运算符

用于组合多个条件进行逻辑判断。

- **逻辑与（&&）**：两边条件都为真时表达式为真，`if [ 条件1 ] && [ 条件2 ]; then...`
- **逻辑或（||）**：两边条件有一个为真表达式为真，`if [ 条件1 ] || [ 条件2 ]; then...`
- **逻辑非（!）**：对条件取反，`if [! 条件 ]; then...`

#### 字符串运算符

用于对字符串进行比较和属性判断。

- **=**：判断两字符串是否相等，`if [ $str1 = $str2 ]; then...`
- **!=**：判断两字符串是否不等，`if [ $str1 != $str2 ]; then...`
- **-z**：判断字符串是否为空，`if [ -z $str ]; then...`
- **-n**：判断字符串是否非空，`if [ -n $str ]; then...`

#### 文件测试运算符

用于检测文件或目录的各种属性。

- **-e**：判断文件或目录是否存在，`if [ -e $file_or_dir ]; then...`
- **-f**：判断是否为普通文件，`if [ -f $file ]; then...`
- **-d**：判断是否为目录，`if [ -d $dir ]; then...`
- **-r**：判断文件是否可读，`if [ -r $file ]; then...`
- **-w**：判断文件是否可写，`if [ -w $file ]; then...`
- **-x**：判断文件是否可执行，`if [ -x $file ]; then...`

##### 加减运算的几种使用方式

```shell
#!/bin/bash

: '
这是第一行注释内容。
这里是第二行注释，可用于解释一段复杂的脚本逻辑。
即使有很多行，都不会被执行。
'

#echo '这是脚本执行de部分'

#案例1：计算(2+3)*4的值
#使用第一种方式
RES1=$(((2+3)*4))
echo "res1=$RES1"

#使用第二种方式，使用其实也还行

RES2=$[(2+3)*4]
echo "res2=$RES2"

#使用第三种方式
TEMP=`expr 2 + 3`
RES4=`expr $TEMP \* 4`
echo "temp=$TEMP"
echo "res4=$RES4"
```

##### [ ] 和 [[ ]]的拓展 

> ### 单方括号 `[ ]`
>
> - **本质**：`[ ]` 实际上是 `test` 命令的一种简化写法，它遵循较为传统和严格的语法规则。在 `[ ]` 中，变量展开和单词拆分遵循基本的 shell 规则。当变量值为空或包含空格等特殊字符时，如果不加引号，就会出现问题。例如，假设 `str="hello world"` ，如果写成 `[ $str = "hello world" ]` ，当 `str` 为空时，命令会变成 `[ = "hello world" ]` ，这会导致语法错误，因为 `[ ]` 期望每个操作数之间有适当的分隔。所以为了保证在各种情况下判断的正确性，使用单方括号进行字符串判断时，变量最好加上引号。
>
> ### 双方括号 `[[ ]]`
>
> - **增强特性**：`[[ ]]` 是 bash 提供的扩展条件判断结构，对字符串处理做了优化。它在处理变量时，会将整个变量作为一个整体看待，不会像 `[ ]` 那样对变量值进行单词拆分。例如 `str="hello world"` ，写成 `[[ $str = "hello world" ]]` ，即使 `str` 为空，`[[ ]]` 也能正确处理，不会引发语法错误。所以在 `[[ ]]` 结构中，通常不需要对变量加引号来处理字符串判断，但加上引号一般也不会出错，且能保持代码风格一致性。

## 条件判断

```shell
#if-then 结构
if [ 条件 ]
then
    # 条件为真时执行的命令
fi

#if-then-else 结构
if [ 条件 ]
then
    # 条件为真时执行的命令
else
    # 条件为假时执行的命令
fi

#if-then-elif 结构
if [ 条件1 ]
then
    # 条件1为真时执行的命令
elif [ 条件2 ]
then
    # 条件2为真时执行的命令
else
    # 所有条件都为假时执行的命令
fi
```

### 双括号 [[ ]] (bash扩展，功能更强大)

```shell
if [[ 条件 ]]
then
    # 命令
fi
```

### 数值比较

```shell
# 传统方式
if [ $a -eq $b ]  # 等于
if [ $a -ne $b ]  # 不等于
if [ $a -gt $b ]  # 大于
if [ $a -lt $b ]  # 小于
if [ $a -ge $b ]  # 大于等于
if [ $a -le $b ]  # 小于等于

# 现代方式(推荐)
if (( a == b ))   # 等于
if (( a != b ))   # 不等于
if (( a > b ))    # 大于
if (( a < b ))    # 小于
if (( a >= b ))   # 大于等于
if (( a <= b ))   # 小于等于
```

###  字符串比较

```shell
# 传统方式
if [ "$str1" = "$str2" ]   # 字符串相等
if [ "$str1" != "$str2" ]  # 字符串不等
if [ -z "$str" ]           # 字符串为空
if [ -n "$str" ]           # 字符串非空

# 现代方式(推荐)
if [[ $str1 == $str2 ]]    # 字符串相等(支持模式匹配)
if [[ $str1 != $str2 ]]    # 字符串不等
if [[ -z $str ]]           # 字符串为空
if [[ -n $str ]]           # 字符串非空
if [[ $str == pattern ]]   # 模式匹配(如 [[ $file == *.txt ]])
if [[ $str =~ regex ]]     # 正则表达式匹配
```

### 文件测试

```shell
if [ -e "$file" ]      # 文件/目录存在
if [ -f "$file" ]      # 是普通文件
if [ -d "$file" ]      # 是目录
if [ -s "$file" ]      # 文件存在且不为空
if [ -r "$file" ]      # 文件可读
if [ -w "$file" ]      # 文件可写
if [ -x "$file" ]      # 文件可执行
if [ -L "$file" ]      # 是符号链接
if [ -O "$file" ]      # 文件属于当前用户
if [ -G "$file" ]      # 文件属于当前用户组
if [ "$file1" -nt "$file2" ]  # file1比file2新
if [ "$file1" -ot "$file2" ]  # file1比file2旧
```

### 逻辑运算符

#### 传统方式

```shell
if [ 条件1 -a 条件2 ]   # AND
if [ 条件1 -o 条件2 ]   # OR
if [ ! 条件 ]           # NOT
```

#### 现代方式(推荐)

```shell
if [[ 条件1 && 条件2 ]]  # AND
if [[ 条件1 || 条件2 ]]  # OR
if [[ ! 条件 ]]          # NOT

# 或者使用多个[]结合shell逻辑运算符
if [ 条件1 ] && [ 条件2 ]
if [ 条件1 ] || [ 条件2 ]
if ! [ 条件 ]
```

### case 语句

```shell
case $变量 in
    模式1)
        命令1
        ;;
    模式2)
        命令2
        ;;
    *)
        默认命令
        ;;
esac
```

```shell
case $OS in
    "Linux")
        echo "Linux系统"
        ;;
    "Windows")
        echo "Windows系统"
        ;;
    "MacOS")
        echo "MacOS系统"
        ;;
    *)
        echo "未知系统"
        ;;
esac
```

#### 注意事项

1. **`[ ]`和`[[ ]]`前后必须有空格：`[ "$a" = "$b" ]`**
2. **字符串变量比较时，变量最好用双引号括起来，防止空变量导致语法错误**
3. **`=`和`==`在`[ ]`中都是字符串比较，在`[[ ]]`中`==`支持模式匹配**
4. **算术比较推荐使用`(( ))`，字符串和文件测试推荐使用`[[ ]]`**
5. **`&&`和`||`在`[ ]`中需要用`-a`和`-o`替代，或者在外部使用shell的逻辑运算符**

#### 条件判断的返回值

Shell中条件判断的返回值为：

- 0 表示真(成功)
- 非0 表示假(失败)

可以通过`$?`获取上一条命令的返回值：

```shell
[ -f "/etc/passwd" ]
echo $?  # 输出0(文件存在)或1(文件不存在)
```

## 流程控制

### 前置知识

#### read(选项)(参数)

**是 Linux shell 中一个非常实用的内置命令，用于从标准输入（通常是键盘）或文件描述符读取数据**

##### 选项

- **`-p`**：指定读取值时的提示符；

- **`-t seonds  `**：指定读取值时等待的时间(秒)，如果没有在指定时间内输入，就不再等待了

- **`-r`：禁止反斜杠转义**
  默认情况下，`read` 会把反斜杠当作转义字符处理。使用 `-r` 选项可以禁止这种行为，使反斜杠按字面意义处理。

##### 参数

**变量：读取值的变量名**

```shell
#读取控制台输入一个NUM1值
read -p "请输入一个数NUM1=" NUM1
echo "你输入的NUM1=$NUM1" 
#读取控制台输入一个NUM2值，在10秒内输入
read -t 10 -p "NUM2="
echo "$NUM2"
```

######  从标准输入读取单个变量

`read name` 命令等待用户在终端输入内容，用户输入后按下回车键，输入的内容将被赋值给变量 `name`，然后通过 `echo` 命令输出。

```shell
echo "请输入你的名字："
read name
echo "你输入的名字是：$name"
```

###### 从标准输入读取多个变量

**`read` 命令根据默认的内部字段分隔符（`IFS`，默认为空格、制表符和换行符）将用户输入的内容拆分成多个部分，并依次赋值给 `name`、`age` 和 `city` 变量。**

```shell
echo "请输入你的名字、年龄和城市，用空格分隔："
read name age city
echo "名字：$name，年龄：$age，城市：$city"
```

###### 从文件读取

`read` 命令可以结合输入重定向从文件中读取内容。

```shell
while read line
do
	echo "读取到：$line"
done < file.txt
```

> ​	**这个 `while` 循环中，`read line` 从 `file.txt` 文件中逐行读取内容，并将每行内容赋值给 `line` 变量，然后通过 `echo` 命令输出。如前文所述，默认情况下，`read` 会依据 `IFS` 处理行内内容，如需按行完整读取，可设置 `IFS` 为空字符串（`while IFS= read -r line`）** 

#### 循环控制的基本语法规则

在 Bash 中，`for`、`while` 和 `until` 这几种常见循环的基本规则类似

- **换行写法不需要加上`;`**

  ```shell
  count=1
  while [ $count -le 5 ]; do
      echo $count
      ((count++))
  done
  ```

  

- **紧凑型写法需要加上**

  ```shell
  count=1
  while [ $count -le 5 ]
  do
      echo $count
      ((count++))
  done
  ```

### for循环

##### 注意

- **for循环中 换行写法不需要加上`;`**
- **紧凑写法需要加上`;`**

```shell
# 标准形式 换行写法
#for var in item1 item2... itemN 表示定义一个循环变量 var，它会依次取值为 item1、item2 直到 itemN。在每次循环中，var 被赋予当前值，然后执行 do 和 done 之间的 commands 命令块。
for var in item1 item2 ... itemN
do
    commands
done

# C语言风格（bash支持） 换行写法
for (( i=0; i<10; i++ ))
do
    echo $i
done

# 遍历文件 紧凑型写法
for file in *.txt; do
    echo "Processing $file"
done
```

**实例**

```bash
#结合命令输出结果遍历 紧凑型写法
#!/bin/bash
for file in $(ls)
do
    size=$(du -h $file | awk '{print $1}')
    echo "文件: $file，大小: $size"
done
#对一系列文件执行操作
#!/bin/bash
for file in file1.txt file2.txt file3.txt
do
    cp $file ${file}.bak
done
```

### while

```shell
while [[ condition ]]; do
    commands
done

# 无限循环
while true; do
    commands
done
```

### unitl循环（与while相反）

**当条件为假时执行循环体，一旦条件变为真，循环就停止。**

```shell
until [[ condition ]]; do
    commands
done
```

### 循环控制

**拓展**

- `{1..3}` 会被扩展为 `1 2 3`。
  - **文件名生成**：在创建多个具有连续编号的文件时很有用。
    - `touch file_{1..3}.txt`
    - 这行命令会创建三个文件，分别是 `file_1.txt`、`file_2.txt` 和 `file_3.txt` 。

#### break 和 continue

```bash
for i in {1..10}; do
    if [[ $i -eq 5 ]]; then
        break    # 退出整个循环
    fi
    echo $i
done

for i in {1..10}; do
    if [[ $i -eq 5 ]]; then
        continue # 跳过本次循环
    fi
    echo $i
done
```

#### 循环标签（嵌套循环控制）

```bash
outer_loop: for i in {1..3}; do
    for j in {1..3}; do
        if [[ $j -eq 2 ]]; then
            break outer_loop # 跳出外层循环
        fi
        echo "i=$i, j=$j"
    done
done
```

### 选择结构

#### “select” 关键字

`	select` 是 bash shell 中用于创建交互式菜单的关键字 。它会自动生成一个带编号的选项列表，并等待用户输入编号来选择其中一个选项。一旦用户做出选择，脚本会根据用户的输入执行相应的操作。

#### “option” 变量

`	option` 是用户自定义的变量名，用于存储用户选择的选项内容 。当用户从 `select` 生成的菜单中选择一个选项后，`option` 变量就会被赋值为该选项的文本内容。例如，在以下代码中：

```bash
PS3="请选择水果: "
select option in "苹果" "香蕉" "橙子"; do
    echo "你选择的水果是: $option"
    break
done

#当执行 select 循环时，系统会自动检查 PS3 变量的值，并将其作为提示信息显示在交互式菜单之前。
```

#### select 菜单（交互式选择）

```shell
PS3="请选择(1-3): "
select option in "选项1" "选项2" "退出"; do
    case $REPLY in
        1) echo "选择了选项1";;
        2) echo "选择了选项2";;
        3) break;;
        *) echo "无效选项";;
    esac
done
```

## 函数控制

#### 系统函数

**basename**

**去掉文件路径和去掉文件后缀**

```shell
ubuntu22@ubuntu22:~/demoshell$ basename ./read.sh 
read.sh
ubuntu22@ubuntu22:~/demoshell$ basename ./read.sh .sh
read
```

**dirname**

**用于从给定的文件路径中提取目录部分**

```shell
dirname /www/server/lib.pl 
/www/server 
```

### 函数定义与调用

```shell
function myfunc() {
    local var1=$1  # 局部变量
    echo "参数1: $var1"
    return 0       # 返回值(0-255)
}

myfunc "参数值"    # 调用函数
echo "返回值: $?"  # 获取返回值
```

###  函数返回值

```bash
# 方式1: return返回状态码
function check_file() {
    [[ -f $1 ]] && return 0 || return 1
}

# 方式2: echo返回数据
function get_date() {
    echo $(date +%F)
}
today=$(get_date)
```

### 特殊流程控制

####  命令列表控制

​	在Shell脚本中，**命令列表控制**是通过特殊符号（如 `;`、`&&`、`||`）或结构（如 `{}`、`()`）来管理多个命令的执行顺序和逻辑关系的机制。以下是详细分类和用法说明：

#### **速查表**
| 需求场景             | 推荐写法                    | 说明             |
| -------------------- | --------------------------- | ---------------- |
| 无条件顺序执行       | `cmd1; cmd2`                | 无论cmd1是否成功 |
| 成功时才执行后续命令 | `cmd1 && cmd2`              | 短路逻辑         |
| 失败时才执行后续命令 | `cmd1 || cmd2`              | 错误处理常用     |
| 组合多个命令         | `{ cmd1; cmd2; }`           | 当前Shell环境    |
| 隔离执行环境         | `(cmd1; cmd2)`              | 子Shell中运行    |
| 复杂条件逻辑         | `cmd1 && { cmd2 || cmd3; }` | 明确分组优先级   |

##### 组合命令( )与{ }分组的区别

**建议用 `{}` 或 `()` 明确分组，但是它们在执行环境和副作用上有本质区别**

| 特性           | `{ }`（花括号）         | `( )`（圆括号）              |
| :------------- | :---------------------- | :--------------------------- |
| **执行环境**   | 当前Shell               | 子Shell（新的进程上下文）    |
| **变量修改**   | 影响父Shell             | 仅子Shell内有效              |
| **资源开销**   | 无额外开销              | 有轻微性能损耗（创建子进程） |
| **必须加分号** | 是（末尾或换行前需`;`） | 否（可省略）                 |
| **信号处理**   | 继承父Shell的trap       | 不继承父Shell的trap          |

###### **变量作用域**

```bash
var="parent"
{ var="child"; echo "内部: $var"; }  # 修改父Shell变量
echo "外部: $var"  # 输出：外部: child

( var="child"; echo "内部: $var" )  # 子Shell中修改
echo "外部: $var"  # 输出：外部: parent（未被修改）
```

###### **目录切换**

```shell
pwd  # 输出: /home/user
{ cd /tmp; pwd; }  # 输出: /tmp
pwd  # 输出: /tmp（影响父Shell）

( cd /tmp; pwd )  # 输出: /tmp
pwd  # 输出: /home/user（不影响父Shell）
```

示例：

```bash
# 顺序执行（全部成功才继续）
command1 && command2 && command3

# 顺序执行（任意成功就继续）
command1 || command2 || command3

# 组合使用
make && make test || echo "编译或测试失败"
```

### 陷阱处理（trap）

**`trap` 是一个强大的信号处理机制，它允许脚本捕获并响应系统信号或脚本状态变化。以下是关于 `trap` 的详细说明：**

#### **核心作用**

- **拦截系统信号**（如 `Ctrl+C` 触发的 `SIGINT`）
- **脚本退出时的清理**（如删除临时文件）
- **错误处理**（如命令失败时回滚操作）
- **调试辅助**（如打印执行信息）

#### 基本语法

```shell
trap "执行的命令" 信号列表
```

###### 常见信号

**号优先级**：
`EXIT` 总是最后执行，其他信号按捕获顺序处理。

| 信号      | 值   | 触发场景                     |
| :-------- | :--- | :--------------------------- |
| `EXIT`    | 0    | 脚本退出时（无论成功或失败） |
| `ERR`     | -    | 命令返回非零状态码时         |
| `SIGINT`  | 2    | 用户按下 `Ctrl+C`            |
| `SIGTERM` | 15   | 收到终止请求（如 `kill`）    |
| `DEBUG`   | -    | 每条命令执行后               |

#### 应用场景

##### 清理临时文件

```bash
trap "echo '脚本被中断'; exit 1" SIGINT SIGTERM

# 清理临时文件
tempfile=$(mktemp)
trap "rm -f $tempfile" EXIT
```

##### 优雅处理中断

```bash
trap "echo '脚本被中断 ';exit 1" SIGINT SIGTERM

while true;do
	sleep 1
done
```

**效果**：
用户按 `Ctrl+C` 时会显示提示信息并退出，而非突然终止。

##### 错误捕获与回滚

```bash
trap "echo '错误发生在第 $LINENO 行'; exit 1" ERR
#$LINENO 是一个特殊变量，它表示当前正在执行的脚本行号,Bash shell的一个内置变量

mkdir /invalid_path  # 此命令会失败，触发trap
```

### 最佳实践

1. **条件判断**：优先使用 `[[ ]]` 而不是 `[ ]` 或 `test`

2. **数值比较**：使用 `(( ))` 算术表达式

3. **循环控制**：

   - 已知次数用 `for`
   - 条件循环用 `while`
   - 文件处理用 `while read` 逐行读取

4. **错误处理**：

   ```bash
   if ! command; then
       echo "命令执行失败" >&2
       exit 1
   fi
   ```

5. **调试技巧**：

   ```bash
   set -x  # 开启调试模式
   set +x  # 关闭调试模式
   ```

### 实用示例

####  逐行处理文件

```bash
while IFS=read -r line; do
    echo "处理行: $line"
done < "filename.txt"

#read 命令用于从标准输入读取数据，并将读取到的数据存储到变量中。
#-r 选项：read 命令的 -r 选项表示 “raw”，即按原始形式读取输入。这意味着它不会对反斜杠（\）进行特殊处理，反斜杠不会被解释为转义字符。例如，如果输入行包含 \n，在没有 -r 选项时，\n 可能会被解释为换行符，而加上 -r 选项后，\n 会被当作普通字符序列处理。
```

**拓展**

> **read**
>
> - `read`是一个 shell 内置命令，主要用于从标准输入（通常是键盘）或文件描述符中读取数据，并将读取到的数据存储到变量中。
>
> - 默认情况下，`read` 命令会依据 `IFS`（Internal Field Separator，内部字段分隔符）来对输入进行分隔。如前面提到，`IFS` 的默认值包含空格（）、制表符（`\t`）和换行符（`\n`） 。**所以需要使用IFS来进行一个操作**
>
> - ```shell
>   #示例说明
>   #!/bin/bash
>   echo "请输入三个值，用空格、制表符或换行符分隔："
>   read var1 var2 var3
>   echo "var1: $var1"
>   echo "var2: $var2"
>   echo "var3: $var3"
>                       
>   #student.txt
>   Alice 20 Math
>   Bob 22 Science
>   Charlie 21 History
>                       
>   #读取文件的时候，每行都会按照name等等三个参数进行变量的赋值,因为read默认按IFS进行分隔字段，内容刚好就是以空格分隔（每行），所以每行的三个值对应其三个参数（name、age、subject）
>   #!/bin/bash
>   while read name age subject
>   do
>       echo "学生姓名: $name，年龄: $age，课程:$History"
>   done < students.txt
>   ```
>
> **IFS**
>
> - `IFS` 是 “Internal Field Separator” 的缩写，即内部字段分隔符，它是一个环境变量。默认情况下，`IFS` 包含空格、制表符和换行符，这些字符用于在 shell 中分割文本字段。例如，当你使用 `for` 循环遍历一个字符串时，`IFS` 会决定字符串如何被拆分成多个部分。
> - 当你**执行 `IFS= read -r line` 时，`IFS=` 这部分将 `IFS` 变量设置为空字符串。这样做的效果是告诉 `read` 命令，不要使用任何字符作为输入行的字段分隔符，而是将整行作为一个整体来读取。**

#### 无限循环+条件退出

```bash
while true; do
    read -p "输入q退出: " input
    [[ $input == "q" ]] && break
done
```

#####  并行处理

```bash
for file in *.log; do
    {
        process "$file" > "${file}.out"
    } &
done
wait # 等待所有后台任务完成
```