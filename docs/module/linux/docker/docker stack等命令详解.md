## 前置知识

**下面的的例子中可能会有alpine Linux的出现，先解释解释**

### `alpine/git` 是什么？

**含义：**

这是一个基于 **Alpine Linux** 的 Docker 镜像，已经预装了 Git 工具。

- `alpine/xxx` 是一系列轻量级 Docker 镜像（由官方维护）
- `alpine/git`：适合在容器中使用 Git 的场景
- 特点：体积小、速度快、安全性高

**Alpine Linux 是一个面向安全、简单、轻量的 Linux 发行版**

- 默认使用 musl libc 和 busybox，占用资源少
- 广泛用于嵌入式系统、Docker 容器
- 包管理器是 `apk`，类似于 apt/yum

#### 对比其他镜像：

| 镜像         | 大小   | 是否带工具 |
| ------------ | ------ | ---------- |
| `alpine/git` | ~27MB  | 有 Git     |
| `alpine`     | ~5MB   | 无 Git     |
| `ubuntu`     | ~64MB  | 有 APT     |
| `centos`     | ~200MB | 有 YUM     |

#### `apk add` 是什么？

**含义：**

这是 **Alpine Linux 中的包管理器命令** ，相当于 Ubuntu/Debian 中的 `apt-get install` 或 CentOS/RHEL 中的 `yum install`。

```bash
apk add --no-cache curl
```

表示：

- `--no-cache`：不缓存索引，节省空间（适合一次性运行）
- `curl`：要安装的软件包
- 用 shell 执行一段命令字符串。
  - `sh`: 表示使用默认 shell（Bash 兼容）
  - `-c`: 后面跟的是要执行的命令字符串

**如果你在容器中运行这个命令，就能获得 `curl` 工具，用于发送 HTTP 请求等。**

​	**在 Docker Swarm 中，为了能够实现对服务部署节点的**精细化控制**和**智能调度**，你确实需要在 Swarm 节点上预先加上适当的**标签 (labels)。

------

# Docker Node基本解答

### 为什么 Swarm 节点需要标签？

Docker Swarm 的调度器本身是智能的，但它需要“知道”每个节点的特性，才能做出更优的决策。节点标签就像给你的服务器贴上“属性贴纸”，告诉 Swarm 这个节点有什么特殊能力或属于哪个分组。

这些标签是你在使用 `deploy.placement.constraints` 或 `deploy.placement.preferences` 时进行调度的依据。

------

### 如何为 Swarm 节点添加标签？

为 Swarm 节点添加标签的命令非常简单，你需要在**管理节点**上执行 `docker node update` 命令：

```bash
docker node update --label-add <LABEL_NAME>=<LABEL_VALUE> <NODE_ID_OR_HOSTNAME>
```

- **`<LABEL_NAME>`**: 你为节点定义的标签名称，例如 `app_role`、`storage_type`、`location` 等。
- **`<LABEL_VALUE>`**: 标签对应的值，例如 `frontend`、`ssd`、`us-east-1` 等。
- **`<NODE_ID_OR_HOSTNAME>`**: 你要添加标签的节点的 ID 或主机名。你可以通过 `docker node ls` 命令查看集群中所有节点的 ID 和主机名。

**举例说明：**

假设你有三个节点：`manager1` (管理节点), `worker1` (工作节点), `worker2` (工作节点)。

1. **给 `worker1` 节点打上“高性能存储”的标签：**

   ```bash
   docker node update --label-add storage_type=ssd worker1
   ```

2. **给 `manager1` 和 `worker2` 节点分别打上“区域”标签：**

   ```bash
   docker node update --label-add region=us-east-1 manager1
   docker node update --label-add region=eu-west-1 worker2
   ```

   > **这些标签本身没有特殊含义**
   >
   > - 它们不是 Docker 内置的选项
   > - 是你自己定义的键值对（key=value）
   > - 可以任意命名，比如：
   >   - `region=us-east-1`
   >   - `storage_type=ssd`
   >   - `role=frontend`
   >   - `zone=production`

3. **确认标签是否添加成功：**

   你可以使用 docker node inspect 命令来查看特定节点的详细信息，包括其标签：

   ```bash
   docker node inspect worker1 | grep Labels -A 5
   ```

   或者直接查看所有节点的列表和它们的部分标签：

   ```bash
   docker node ls --format "{{.ID}}\t{{.Hostname}}\t{{.Labels}}"
   ```

------

## 具体操作

### 节点角色切换与多角色节点

- **`docker swarm init`：** 当你在一个节点上执行 `docker swarm init` 时，该节点会初始化一个 Swarm 并成为**第一个 Manager 节点**。默认情况下，它也会同时扮演 Worker 角色。
- **`docker swarm join`：** 当你使用 `docker swarm join` 命令将其他节点加入集群时，它们默认会成为 Worker 节点。
- 角色切换：
  - 你可以将 Worker 节点提升为 Manager：`docker node promote <NODE_ID>`
  - 你也可以将 Manager 节点降级为 Worker：`docker node demote <NODE_ID>` (如果降级后管理器数量低于多数派，可能会影响集群稳定性)。

### 节点状态与管理命令

理解节点状态对于排除故障和日常管理至关重要。

- **`docker node ls`：**
  - **作用：** 列出 Swarm 集群中所有节点的信息。
  - 重要字段：
    - `HOSTNAME`：节点的主机名。
    - `STATUS`：节点状态 (`Ready` - 可用, `Down` - 不可用, `Disconnected` - 失联)。
    - `AVAILABILITY`：节点的调度可用性 (`Active` - 可以调度任务, `Pause` - 暂时不调度任务, `Drain` - 停止调度新任务并驱逐现有任务)。
    - `MANAGER STATUS`：管理器节点的状态（`Leader` - 领导者, `Reachable` - 可达的跟随者, `Unavailable` - 不可用）。对于 Worker 节点，此字段为空。
- **`docker node inspect <NODE_ID>`：**
  - **作用：** 查看某个节点的详细信息，包括其 IP 地址、标签、Engine 版本、健康状态等。
- **`docker node update`：**
  - **作用：** 更新节点的属性，如添加/移除标签，或改变其可用性。
  - **添加标签：** `docker node update --label-add <KEY>=<VALUE> <NODE_ID>` (我们前面课程中已经用过这个命令！)
  - **改变可用性：** `docker node update --availability drain <NODE_ID>` (将节点设置为 `Drain` 状态，用于维护或下线节点，以便 Swarm 将其上的所有任务迁移到其他节点)。
- **`docker node rm <NODE_ID>`：**
  - **作用：** 将一个节点从 Swarm 集群中移除。
  - **注意：** 移除 Manager 节点前，确保有足够多的其他 Manager 节点来维持多数派。移除节点前通常需要将其设置为 `Drain` 状态并等待任务迁移完成。

### 节点标签在 `docker-compose.yml` 中的应用

一旦节点打好了标签，你就可以在服务的 `deploy` 部分使用这些标签来定义部署策略了：

```yaml
services:
  database:
    image: postgres:15
    deploy:
      replicas: 1
      placement:
        constraints:
          # 强制将数据库服务部署到带有 storage_type=ssd 标签的节点上
          - 'node.labels.storage_type == ssd'

  frontend:
    image: myapp/frontend
    deploy:
      replicas: 3
      placement:
        preferences:
          # 尽量将前端服务的副本分散到不同 region 标签的节点上
          - spread: node.labels.region
```

------

#### 总结

​	**在 Docker Swarm 中，为节点打上具有业务或物理意义的标签，是实现高级调度和管理分布式应用的基础。** 这就像给你的服务器贴上智能标签，让 Swarm 调度器能根据你的意图，将不同的服务部署到最适合它们的“家”。

# Docker Stack

​	单机模式下，可以使用 Docker Compose 来编排多个服务。Docker Swarm 只能实现对单个服务的简单部署。而Docker Stack 只需对已有的 docker-compose.yml 配置文件稍加改造就可以完成 Docker 集群环境下的多服务编排。

​	如果说 Docker Compose 是你单机开发时的“项目配置文件”，那么 **Docker Stack** 就是这个配置文件在 Swarm 集群上的“部署蓝图”和“应用程序管理单元”。它允许你将一个由多个相关服务组成的复杂应用程序作为一个整体进行部署、管理和更新。

### 核心配置文件

**docker-compose.yaml**

- **服务顶级元素属性：deploy**
  - **核心配置！** 定义服务在 Swarm 中的副本数、重启策略、更新策略、资源限制、调度约束等。

#### `deploy` 的主要属性选项

**[官方文档选项解释](https://docs.docker.com/reference/compose-file/deploy/#labels)**

`deploy` 关键字下可以配置许多属性，它们共同决定了服务在 Swarm 集群中的行为和生命周期。

```yaml
services:
  your-service:
    # ... 其他服务配置 (image, ports, volumes, networks, environment 等)
    deploy:
      # 1. 副本管理
      replicas: <integer> # 指定服务应运行的副本数量（默认 1）
      mode: replicated | global # 部署模式：
                                # - replicated (副本集): 运行指定数量的副本。
                                # - global (全局): 在每个可用节点上运行一个副本。

      # 2. 资源限制和预留
      resources:
        limits: # 强制限制容器可以使用的最大资源
          cpus: '<float>' # 例如 '0.5' 表示 0.5 个 CPU 核心
          memory: '<bytes>' # 例如 '512M' 或 '1G'
        reservations: # 为容器预留的最小资源，确保调度时有这些资源可用
          cpus: '<float>'
          memory: '<bytes>'

      # 3. 重启策略
      restart_policy:
        condition: on-failure | any | none # 重启条件：
                                            # - on-failure: 仅当容器退出代码非 0 时重启。
                                            # - any: 任何情况下都重启（默认）。
                                            # - none: 不重启。
        delay: <duration> # 容器重启前的等待时间（例如 '5s'）
        max_attempts: <integer> # 在放弃重启前尝试的最大次数（默认 0，表示无限次）
        window: <duration> # 检查重启尝试是否失败的时间窗口（例如 '120s'）

      # 4. 放置约束 (Placement Constraints) 和偏好 (Preferences)
      placement:
        constraints: # 强制约束，服务任务只会在满足这些条件的节点上运行
          - 'node.role == manager' # 示例：只在管理器节点上运行
          - 'node.labels.zone == us-east-1' # 示例：只在带有 'zone=us-east-1' 标签的节点上运行
          - 'node.hostname != node-01' # 示例：不在 node-01 上运行
        preferences: # 软偏好，用于指导 Swarm 如何分散或集中任务
          - spread: node.labels.zone # 尽量将任务分散到不同 'zone' 标签的节点上
          - spread: node.hostname # 尽量将任务分散到不同主机上 (默认行为)
          # - spread: <arbitrary label> # 可以基于任何标签进行分散

      # 5. 更新策略 (滚动更新)
      update_config:
        parallelism: <integer> # 同时更新的容器副本数量（默认 1）
        delay: <duration> # 更新每个批次副本之间的等待时间（例如 '10s'）
        failure_action: continue | pause # 如果更新失败（新容器启动失败），是继续还是暂停更新（默认 'pause'）
        monitor: <duration> # 更新后，在将此批次标记为成功之前，监控其启动并保持健康的时间（例如 '30s'）
        max_failure_ratio: <float> # 允许的最大失败任务比例（0.0 到 1.0 之间，默认 0.0）
        order: stop-first | start-first # 更新时，是先停止旧容器再启动新容器，还是先启动新容器再停止旧容器（默认 'stop-first'）

      # 6. 回滚策略 (与 update_config 配合)
      rollback_config:
        parallelism: <integer> # 同时回滚的容器副本数量
        delay: <duration> # 回滚每个批次副本之间的等待时间
        failure_action: continue | pause # 如果回滚失败，是继续还是暂停（默认 'pause'）
        monitor: <duration> # 回滚后监控的时间
        max_failure_ratio: <float> # 允许的最大失败任务比例
        order: stop-first | start-first # 回滚时，是先停止旧容器还是先启动新容器（默认 'stop-first'）

      # 7. 容器的健康检查（独立于 Dockerfile 的 HEALTHCHECK 指令）
      healthcheck:
        test: ["CMD", "curl", "-f", "http://localhost/healthz"] # 容器内执行的健康检查命令
        interval: <duration> # 检查间隔（例如 '5s'）
        timeout: <duration> # 检查超时时间（例如 '3s'）
        retries: <integer> # 失败多少次后认为不健康
        start_period: <duration> # 容器启动后，在开始健康检查前等待的时间，允许服务初始化（例如 '1m'）

      # 8. 凭证获取（针对私人镜像仓库，通常通过 Docker CLI login 或 ~/.docker/config.json）
      # creds_spec:
      #   config: <config-name> | file://<path-to-file> # 指定凭证配置

      # 9. 标签（为服务添加标签，与节点标签不同）
      ###
      #labels: 是为服务/容器添加描述性信息的元数据，不会直接影响调度，但可以被其他工具识别、分类或用于审计。它和“节点标签”是不同的概念，后者是用来控制服务运行在哪台机器上的。
      ###
      labels:
       #这是一种推荐的命名规范，目的是避免命名冲突。建议格式如下：
      #<org>.<project>.<key>，这样即使多个团队使用相同的 key（如 version），也不会互相覆盖。
        com.example.project: myapp
        com.example.version: v1.0
```

### 复杂举例

#### **一个具有高可用、弹性伸缩和零停机更新的 Web 应用栈**

**场景描述：**

我们有一个 Web 应用 (`web-frontend`) 和一个 API 服务 (`api-backend`)，它们都连接到一个数据库 (`db`)。

- `web-frontend` 和 `api-backend` 需要高可用和弹性伸缩。
- `db` 服务需要持久化数据，并且我们希望它只运行在带有特定存储标签的节点上（假设我们有专门的数据库节点）。
- 所有服务都需要平滑的滚动更新。
- 我们还会为 `api-backend` 设置资源限制和健康检查。

##### 编写`docker-compose.yaml`文件内容

```bash
services:
  web-frontend:
    image: nginxdemos/hello:plain-text # 简单的 Web 前端，显示 Hello World
    ports:
      - "80:80" # 通过路由网格暴露在集群所有节点的 80 端口
    networks:
      - app_overlay_net # 连接到应用共享的 Overlay 网络
    deploy:
      replicas: 3 # 部署 3 个副本，实现高可用和负载均衡
      mode: replicated # 明确指定为副本集模式
      resources:
        limits: # 限制前端服务最多使用 0.5 CPU 核心和 256MB 内存
          cpus: '0.5'
          memory: '256M'
        reservations: # 预留 0.1 CPU 核心和 64MB 内存，确保基本资源可用
          cpus: '0.1'
          memory: '64M'
      restart_policy:
        condition: on-failure # 只有当容器非正常退出时才重启
        delay: 5s # 重启前等待 5 秒
        max_attempts: 3 # 最多尝试 3 次重启
      update_config:
        parallelism: 1 # 每次只更新 1 个副本，确保最小中断
        delay: 15s # 每个副本更新之间等待 15 秒，给新副本足够时间启动和健康检查
        failure_action: pause # 如果更新失败，暂停整个更新过程
        monitor: 60s # 更新后，监控新副本 60 秒，确认健康后才继续下一个
        order: start-first # 先启动新容器，再停止旧容器 (通常用于确保服务不中断)
      placement:
        preferences:
          - spread: node.labels.zone # 优先将副本分散到不同的 zone 标签节点上，增强区域容错

  api-backend:
    image: alpine/git # 模拟一个简单的 API 后端，它会监听 8080 端口并返回一些信息
    command: sh -c "apk add --no-cache netcat-openbsd && while true; do echo -e 'HTTP/1.1 200 OK\n\nAPI Backend Response from $(hostname)!' | nc -l -p 8080; done"
    networks:
      - app_overlay_net
    environment:
      DB_HOST: db # 通过服务名称访问数据库
      DB_PORT: 3306
    deploy:
      replicas: 2 # 部署 2 个 API 后端副本
      mode: replicated
      resources:
        limits:
          cpus: '1.0'
          memory: '512M'
        reservations:
          cpus: '0.2'
          memory: '128M'
      restart_policy:
      #无论容器如何退出，都会被自动重启，适合需要持续运行的服务 。它是 Docker Swarm 实现服务自愈能力的核心机制之一。
        condition: any # 任何情况都重启
      healthcheck: # 为 API 服务添加健康检查
        test: ["CMD", "curl", "-f", "http://localhost:8080/health"] # 假设 API 有 /health 端点
        interval: 10s # 每 10 秒检查一次
        timeout: 5s # 检查超时 5 秒
        retries: 3 # 失败 3 次后认为不健康
        start_period: 30s # 容器启动后 30 秒才开始健康检查
      placement:
        constraints:
          - node.role == worker # 确保 API 服务只运行在工作节点上

  db:
    image: mariadb:latest # MariaDB 数据库
    environment:
      MYSQL_ROOT_PASSWORD: mysecretpassword
      MYSQL_DATABASE: mydatabase
    volumes:
      - db_data:/var/lib/mysql # 持久化数据库数据
    networks:
      - app_overlay_net
    deploy:
      replicas: 1 # 数据库通常保持一个主副本，或通过数据库本身的集群功能实现高可用
      mode: replicated
      restart_policy:
        condition: on-failure
      placement:
        constraints:
          - node.labels.storage == high-performance # 强制数据库只在带有 'storage=high-performance' 标签的节点上运行
                                                    # 你需要提前在 Swarm 节点上打好这个标签：
                                                    # docker node update --label-add storage=high-performance <node_id_or_hostname>
volumes:
  db_data: # 命名卷，用于持久化数据库数据

networks:
  app_overlay_net:
    driver: overlay
    attachable: true # 允许外部连接，方便调试
```

**根据上面yaml文件的配置，swarm会根据placement进行一个节点部署，不同服务部署到不同的节点容器当中**

###### **拓展**

> - **mode: replicated** 
>
>   - 是 Docker Swarm 中最常用的服务运行模式，表示你要运行固定数量的副本（由 replicas 指定），适合大多数无状态服务，实现负载均衡和高可用。 
>
> - **healthcheck**
>
>   - `test: ["CMD", "curl", "-f", "http://localhost:8080/health"]`
>     - **`/health` 这个端点通常是你自己在应用程序中实现的一个接口路径** 。它不是 Docker 自动提供的，而是由你的服务代码定义的，用于告诉 Docker：“我是否还活着”。 
>
> - **resource**
>
>   - **这个值是需要根据你的应用需求和宿主机/集群的总资源进行合理估算和配置的** 。它不是随便写的，也不是越高越好，而是要根据实际服务负载、可用资源以及系统稳定性来设定。
>
>   - **`resources.limits` 的值不是随便写的，而是需要结合你的服务资源消耗情况、节点资源总量、高可用需求等因素合理设置** 。它可以帮助你避免资源争用、提升系统稳定性，并支持更合理的调度和扩缩容策略。
>
>   - **如何进行配置呢**
>
>     - 步骤一：了解应用资源消耗
>
>       - 通过以下方式查看一个运行中的容器资源使用情况：
>
>         ```bash
>         docker stats <container_id>
>         #观察它的 CPU% 和 MEM% 使用率。
>         ```
>
>     - 步骤二：根据资源使用设定限制
>
>       #### 示例场景：
>
>       | 应用类型                 | 推荐配置                    |
>       | ------------------------ | --------------------------- |
>       | 静态网页（Nginx + HTML） | `0.2~0.5`CPU,`64~128MB`内存 |
>       | Node.js 小型 API 服务    | `0.5~1`CPU,`128~256MB`内存  |
>       | Java Spring Boot 微服务  | `1~2`CPU,`512MB~2GB`内存    |
>       | Python Flask/Django 服务 | `0.5~1`CPU,`256MB~1GB`内存  |
>
>     - 步骤三：确保不超过节点总资源
>
>       假设你有一个节点有4核CPU和8GB内存：
>
>       | 每个副本资源限制     | 可部署副本数（粗略）       |
>       | -------------------- | -------------------------- |
>       | CPU: 0.5, Mem: 256MB | 7 个（受 CPU 限制）        |
>       | CPU: 1, Mem: 512MB   | 4 个（CPU 和内存都接近满） |
>
>       ⚠️ 如果你设置了太高的副本数或太松的资源限制，可能导致资源争用甚至节点崩溃。
>
>       ##### 最佳实践建议：
>
>       | 目标          | 建议                                                         |
>       | ------------- | ------------------------------------------------------------ |
>       | 避免 OOM      | 给内存留出一定余量（比如实际占用 150MB，设为 256MB）         |
>       | 防止 CPU 抢占 | 控制 CPU 分配总量不要超过节点总核心数                        |
>       | 设置默认值    | 在生产环境中，最好统一设置资源限制策略（如使用 Kubernetes 的 LimitRange） |
>       | 使用监控工具  | Prometheus + Grafana 可以实时监控容器资源使用情况            |

#### 部署和验证这个复杂例子

##### Docker集群准备好

确保你有一个运行中的 Docker Swarm 集群。如果你有多台机器，最好给至少一个工作节点打上标签：

```bash
# 在 Swarm 管理节点上执行
# 找到你的 worker 节点 ID 或 HOSTNAME (例如 'worker1')
docker node update --label-add storage=high-performance worker1
# 可选：如果你想测试 node.labels.zone，也打上标签
docker node update --label-add zone=us-east-1 manager1
docker node update --label-add zone=us-west-1 worker1
```

- **保存上述 YAML 到 `my-complex-app/docker-compose.yml`**

##### 部署栈

```bash
docker stack deploy -c docker-compose.yml my-complex-app
```

##### **验证部署**

- `docker stack ls`：查看栈是否部署成功。
- `docker stack services my-complex-app`：查看服务概览。
- `docker stack ps my-complex-app`：**仔细查看每个服务的所有任务状态和它们被调度到了哪个节点上。** 特别注意 `db` 服务是否只在带有 `storage=high-performance` 标签的节点上运行。
- 访问 `http://localhost:80`（或你集群任意节点的IP:80），验证 `web-frontend` 是否正常工作。

##### **模拟更新**

- 修改 `web-frontend` 的 `image` 为 `nginx:latest`。
- 再次运行 `docker stack deploy -c docker-compose.yml my-complex-app`。
- 观察 `docker stack ps my-complex-app` 的输出，你会看到 `web-frontend` 的任务**一个接一个地**被替换（因为 `parallelism: 1` 和 `delay: 15s`），并且新的任务会经过 `monitor: 60s` 的健康检查。

##### **模拟失败和回滚**

- 故意在 `api-backend` 的 `command` 中引入一个错误，例如： `command: sh -c "exit 1"` (让它立即退出)
- 再次部署 `docker stack deploy -c docker-compose.yml my-complex-app`。
- 观察 `api-backend` 的任务状态。你会发现它们不断启动，然后失败，但由于 `failure_action: pause`，整个更新过程会暂停。
- 修复 `command` 中的错误，再次部署，或者执行 `docker service rollback my-complex-app_api-backend` 来回滚。

##### 清理

```bash
docker stack rm my-complex-app
```

### `deploy` 属性的深入思考

通过这个复杂的例子，应该能体会到 `deploy` 块的强大之处：

- **精细控制：** 你可以非常精细地控制每个服务在集群中的行为，包括副本数量、资源使用、调度位置、故障恢复和更新方式。
- **高可用策略：** `replicas` 和 `restart_policy` 结合，确保服务在容器或节点层面出现故障时能够自动恢复。
- **资源管理：** `resources` 限制有助于防止单个服务耗尽集群资源，预留则确保关键服务能获得必要的最小资源。
- **智能调度：** `placement` 属性允许你根据节点特性（如硬件配置、地理位置、特定功能）将服务部署到最合适的节点上，这对于异构集群非常重要。
- **零停机更新：** `update_config` 提供了一套完整的策略，让你的服务能够在不影响用户体验的情况下进行版本升级或配置更改。`start-first` 选项尤其有助于降低更新时的潜在停机风险。
- **健壮性：** `healthcheck` 让 Swarm 能够更智能地判断一个容器是否真的“健康”（不仅仅是启动了），从而在不健康的副本上进行替换。

`deploy` 属性是 Docker Swarm 提供生产级容器编排能力的关键。掌握它们，你就能更好地设计、部署和管理高可用、可伸缩的微服务架构。

# Docker Secret && Config

**如何安全地管理敏感数据和非敏感配置**

​	在分布式系统中，硬编码密码、API 密钥、数据库连接字符串等敏感信息，或者将配置文件直接打包到镜像中，都是非常不安全的做法。这不仅增加了泄露的风险，也使得配置的修改和更新变得复杂。

​	Docker Swarm 为此提供了两个强大的内置功能：**Docker Secret** 和 **Docker Config**。它们允许你以安全且易于管理的方式将敏感数据和配置注入到 Swarm 服务中。

### 实践环节

**体验 Docker Secrect 和 Config，先有一个swarm集群**

实践：**将部署一个简单的nginx 服务，生死用 Secrect来管理一个敏感信息（例如 API 密钥），并使用 Config 来管理一个Nginx 配置文件**

#### docker Secret环节

假设有一个API密钥，不想将其直接暴露在Compose文件或环境变量中

##### 创建Secrec文件

- 在你的工作目录下，创建一个名为 `api_key.txt` 的文件，并向其中写入你的敏感密钥。

  ```bash
  echo "my_super_secret_api_key_12345" > api_key.txt
  ```
  
  **关于一些安全性的解答：**
  
  > ##### 本地工作目录下的 `api_key.txt`：
  >
  > - **这是临时的！** `api_key.txt` 文件在你的本地工作目录中，是为了作为 `docker secret create` 命令的**输入源**。一旦你执行了 `docker secret create my_api_key api_key.txt` 命令，这个文件的**使命就基本完成了**。
  > - **你可以立刻删除它！** 在 Secret 被创建并存储到 Docker Swarm 之后，`api_key.txt` 这个本地文件就已经**不再需要了**。为了安全起见，**你应该在 Secret 创建成功后立即删除这个本地文件。**
  >
  > ##### Docker Swarm 中存储的 Secret：
  >
  > - **加密存储：** 一旦 Secret 通过 `docker secret create` 命令进入 Docker Swarm，它的内容就会被 Swarm **加密**并存储在 Swarm 的**分布式存储（Raft KV Store）**中。
  > - **传输加密：** 当 Swarm 需要将 Secret 分发给某个节点上的容器时，它会在 Swarm 管理节点和工作节点之间进行**加密传输**。
  > - **内存挂载：** 在容器内部，Secret 不会写入到容器的磁盘层，而是以**内存文件系统 (tmpfs)** 的形式挂载到 `/run/secrets/` 路径下。这意味着当容器停止或任务被移除时，这个文件内容会从内存中清除，不会留下持久化的痕迹。
  > - **权限限制：** 挂载在容器内的 Secret 文件通常只有 `root` 用户才有读取权限，进一步限制了访问。
  > - **API 不可见：** 通过 `docker secret ls` 或 `docker secret inspect` 命令，你**无法**直接看到 Secret 的原始内容，只能看到其元数据（ID、名称、创建时间）。

##### 创建Docker Secret

使用 `docker secret create` 命令将文件内容作为 Docker Secret 存储在 Swarm 中。

**`my_api_key` 是这个 Secret 在 Swarm 中的名称。**

```bash
docker secret create my_api_key api_key.txt
```

##### 验证Secret是否已创建

```shell
docker secret ls
```

##### 修改 `docker-compose.yml` 文件以使用 Secret：

```yaml
version: '3.8'

services:
  web:
    image: alpine/git # 使用 alpine/git，因为 curl 通常内置或可安装
    command: sh -c "apk add --no-cache curl && echo 'Starting web service...' && sleep 5 && echo 'My API Key is: ' && cat /run/secrets/my_api_key && echo 'Service running...'"
    networks:
      - app-net
    secrets:
      - my_api_key # 引用在 Swarm 中创建的 Secret
    deploy:
      replicas: 1

networks:
  app-net:
    driver: overlay
    attachable: true
```

- **`secrets:`** 部分用于引用 Swarm 中已存在的 Secret。
- 在容器内部，Secret 会被挂载到 `/run/secrets/<secret_name>` 路径下，你可以在容器内部像文件一样读取它。

##### 部署 Stack

```bash
docker stack deploy -c docker-compose.yml my-secret-app

#验证 Secret 是否被注入，查看服务日志，你会看到 my_api_key 的内容被输出
docker service logs my-sceret-app_web
	#你将看到类似 My API Key is: my_super_secret_api_key_12345 的输出。
```

##### 尝试进入容器验证

```bash
#找到 找到 my-secret-app_web 容器的 ID：
docker ps | grep my-secret-app_web
#进入容器内部
docker exec -it <CONTAINER_ID> sh
#在容器内查看Secret文件
ls -l /run/secrets/
cat /run/secrets/my_api_key
#你将会看到文件和其内容
```

##### 清理 Secret 和 Stack：

```bash
docker stack rm my-secret-app
docker secret rm my_api_key
```

#### docker config环节

现在，我们来管理一个非敏感的配置文件，例如 Nginx 的自定义配置。

##### 创建Nginx的Config文件

在你的工作目录下，创建一个名为 `nginx_custom.conf` 的文件，内容如下：

```nginx
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        location / {
            return 200 'Hello from Nginx configured by Docker Config!';
            add_header Content-Type text/plain;
        }
        location /status {
            stub_status on;
            allow 127.0.0.1; # 只允许本地访问，安全考虑
            deny all;
        }
    }
}
```

##### 创建Docker Config

使用 `docker config create` 命令将文件内容作为 Docker Config 存储在 Swarm 中。

```bash
docker config create my_nginx_config nginx_custom.conf
```

`my_nginx_config` 是这个 Config 在 Swarm 中的名称。

##### 验证 Config 是否已经创建

```bash
docker config ls
#你会看到 my_nginx_config 已经列出
```

##### 修改 `docker-compose.yml` 文件以使用 Config：

```bash
version: '3.8'

services:
  web:
    image: nginx:latest
    ports:
      - "8080:80" # 映射到 8080 端口，避免冲突
    networks:
      - app-net
    configs:
      - source: my_nginx_config # 引用 Swarm 中创建的 Config
        target: /etc/nginx/nginx.conf # 指定 Config 在容器内的路径
    deploy:
      replicas: 1

networks:
  app-net:
    driver: overlay
    attachable: true
```

- **`configs:`** 部分用于引用 Swarm 中已存在的 Config。
- `source`: Swarm 中 Config 的名称。
- `target`: Config 在容器内部被挂载的路径和文件名。

##### 部署Stack

```bash
docker stack deploy -c docker-compose.yml my-config-app
```

- **验证 Config 是否被注入和生效**

​	打开浏览器访问 `http://localhost:8080`。你应该会看到 Nginx 返回 `Hello from Nginx configured by Docker Config`。 

​	尝试访问 `http://localhost:8080/status` (虽然你不能从宿主机直接访问，因为我们配置了 `allow 127.0.0.1;` 在容器内部，但这证明配置已生效)。

##### 清理 Config 和 Stack

```bash
docker stack rm my_config_app
docker config rm my_nginx_config
```

#### 拓展：如果nginx.conf中使用 include包含文件时如何操作

- **创建一个 `my_nginx_main.conf` 文件**，作为你的主 Nginx 配置内容，其中包含 `include /etc/nginx/conf.d/*.conf;`。

- **创建一个 Docker Config** 命名为 `my_nginx_main_config`，内容是 `my_nginx_main.conf`。

- 在 `docker-compose.yml` 中，将 `my_nginx_main_config` 挂载到 Nginx 容器的 `/etc/nginx/nginx.conf`。

- **创建其他单独的 `.conf` 文件**（例如 `my_web_server.conf`, `api_gateway.conf`），包含独立的 `server {}` 或 `location {}` 块。

- **为每个这样的文件创建独立的 Docker Configs**（例如 `my_web_server_config`, `api_gateway_config`）。

- 在 `docker-compose.yml` 中，将这些 Configs 分别挂载到 Nginx 容器的 `/etc/nginx/conf.d/` 目录下，例如：

  - `target: /etc/nginx/conf.d/my_web_server.conf`
  - `target: /etc/nginx/conf.d/api_gateway.conf`

  ```bash
  docker config create my_nginx_main_config nginx-main.conf
  docker config create my_website_config my-website.conf
  ```

##### 配置时这样子操作

```yaml
service:
	configs:
      # 注入主配置文件
      - source: my_nginx_main_config
        target: /etc/nginx/nginx.conf
      # 注入自定义网站配置文件到 conf.d 目录
      - source: my_website_config
        target: /etc/nginx/conf.d/my-website.conf
```



### 理论深度解析：理解 Docker Secret 和 Config

#### Docker Secret：安全管理敏感数据

------

##### 什么是 Docker Secret？

**Docker Secret** 是 Docker Swarm 提供的一种机制，用于在 Swarm 集群中**安全地存储和管理敏感数据**。这些敏感数据包括密码、API 令牌、SSH 私钥、TLS 证书等。

##### Secret 的安全特性：

1. **加密存储：** Secret 在 Swarm 管理节点上以**加密**的形式存储。
2. **传输加密：** Secret 在 Swarm 管理节点和工作节点之间传输时是**加密**的。
3. **临时性挂载：** 当 Secret 被注入到服务容器中时，它不会作为环境变量直接暴露，而是以**内存文件系统 (tmpfs)** 的形式挂载到容器的 `/run/secrets/` 目录下（或你指定的其他路径）。这意味着 Secret 不会写入到容器的磁盘层，降低了泄露风险。
4. **按需分发：** Secret 只会被分发到需要它的服务任务所在的节点上。
5. **内存卸载：** 当容器停止或任务被移除时，Secret 会自动从节点的内存中卸载。
6. **权限控制：** 容器内部 Secret 文件的权限默认设置为只有 `root` 用户可读。

##### Secret 的使用场景：

- 数据库密码
- API 密钥和令牌
- 私有镜像仓库凭证
- SSH 私钥
- TLS/SSL 证书和私钥

##### Secret 的生命周期：

1. **创建：** `docker secret create <name> <file>`。文件内容被加密并存储在 Swarm KV Store 中。
2. **分发：** 当服务被部署并引用了 Secret 时，Swarm 管理节点将加密的 Secret 分发给目标工作节点。
3. **解密和挂载：** 工作节点收到 Secret 后，在容器启动时将其解密，并以文件形式挂载到容器的 `/run/secrets/<secret_name>` 路径。
4. **删除：** `docker secret rm <name>`。删除后，Secret 会从 Swarm KV Store 和所有节点内存中移除。

------

#### Docker Config：管理非敏感配置

------

##### 什么是 Docker Config？

**Docker Config** 是 Docker Swarm 提供的一种机制，用于在 Swarm 集群中**分发和管理非敏感配置数据**。这些数据通常是应用程序的配置文件、模板、初始化脚本等。

###### Config 的特性：

1. **明文存储：** Configs 在 Swarm 管理节点上以**明文**形式存储。因此，**它不适合存储敏感信息**。
2. **传输加密：** Configs 在 Swarm 管理节点和工作节点之间传输时是**加密**的。
3. **文件挂载：** Configs 会以文件的形式挂载到容器的指定路径下。
4. **按需分发：** Configs 只会被分发到需要它的服务任务所在的节点上。
5. **只读：** 容器内部挂载的 Config 文件是只读的，防止意外修改。

###### Config 的使用场景：

- Web 服务器配置文件 (如 Nginx.conf, Apache.conf)
- 应用程序的 `.ini`, `.json`, `.xml` 配置文件
- 环境变量文件 (不含敏感信息的)
- 初始化脚本或启动脚本
- 模板文件

###### Config 的生命周期：

1. **创建：** `docker config create <name> <file>`。文件内容被存储在 Swarm KV Store 中。
2. **分发：** 当服务被部署并引用了 Config 时，Swarm 管理节点将 Config 分发给目标工作节点。
3. **挂载：** 工作节点收到 Config 后，在容器启动时将其挂载到容器的指定路径。
4. **删除：** `docker config rm <name>`。删除后，Config 会从 Swarm KV Store 和所有节点文件系统（如果已挂载）中移除。

------

#### Secret 和 Config 的共同优势：

- **集中管理：** 所有敏感数据和配置都集中存储在 Swarm 中，易于管理和审计。
- **版本控制：** 它们的更新是原子的，可以配合服务滚动更新，实现配置的无缝升级。
- **环境隔离：** 不同的服务可以访问不同的 Secret 或 Config，或者在不同环境中注入不同的配置。
- **安全性 (Secret 特有)：** 针对敏感数据提供了额外的加密和安全措施。
- **不污染镜像：** 应用程序镜像可以保持通用，不需要包含任何环境特定的配置或凭证，提高了镜像的可移植性和安全性。

#### Secret 和 Config 的核心区别：

| 特性           | Docker Secret                                   | Docker Config                                 |
| -------------- | ----------------------------------------------- | --------------------------------------------- |
| **用途**       | 存储和管理**敏感**数据                          | 存储和管理**非敏感**配置数据                  |
| **存储方式**   | 在 Swarm 中**加密**存储                         | 在 Swarm 中**明文**存储                       |
| **传输方式**   | **加密**传输                                    | **加密**传输                                  |
| **容器内挂载** | 默认挂载到 `/run/secrets/<secret_name>` (tmpfs) | 挂载到容器指定路径 (通常是普通文件系统，只读) |
| **安全性**     | **高**，适合密码、密钥                          | **中**，适合配置文件，不适合密码              |

##### 实际应用中的选择：

- **如果数据是敏感的（密码、密钥、证书等）**：**必须使用 Docker Secret**。
- **如果数据是非敏感的（Nginx 配置、日志级别、连接字符串但不含密码等）**：**可以使用 Docker Config**，这比直接在镜像中打包或使用环境变量更灵活且易于管理。

------

##### “Secret & Config 大师”挑战

1. **高级 Nginx 配置与多站点：**
   - 创建一个 `my_nginx_main.conf` 作为 Nginx 的主配置，并通过 Config 注入。
   - 创建多个 `my_site_a.conf` 和 `my_site_b.conf` 作为虚拟主机配置。
   - 将这些虚拟主机配置也通过 Config 注入到 Nginx 容器的 `conf.d` 目录。
   - 验证 Nginx 能否同时为多个虚拟主机提供服务。
2. **数据库连接 Secret：**
   - 创建一个 `db_user.txt` 和 `db_password.txt` Secret。
   - 在你的 `docker-compose.yml` 中，将这些 Secret 注入到一个模拟的后端服务中（例如一个 Alpine 容器，里面运行一个脚本读取这些 Secret）。
   - 确保后端服务能够读取到这些 Secret 并打印出来（仅用于测试，生产环境不应打印敏感信息）。
3. **Secret 和 Config 的更新：**
   - 更改已部署的 `my_api_key` Secret 的内容（你需要删除旧的 Secret 并创建新的，或者使用工具更新）。
   - 更改已部署的 `my_nginx_config` 的内容。
   - 然后重新部署你的 Stack (`docker stack deploy`)。
   - 观察服务是否执行滚动更新，并且新启动的容器是否使用了更新后的 Secret 和 Config。