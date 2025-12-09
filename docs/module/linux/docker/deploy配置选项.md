#### Docker Swarm 服务部署配置 (`deploy`) 详解

​	`deploy` 关键字是 Docker Compose 文件在 **Docker Swarm 模式**下的核心配置块。它定义了 Swarm 调度器如何管理和部署你的服务副本。`docker compose up` 命令会忽略此配置，仅 `docker stack deploy` 或 `docker service create/update` 命令生效。

##### 1. 副本管理 (`replicas` 和 `mode`)

- **`replicas: <integer>`**
  - **作用：** 指定该服务应在 Swarm 集群中运行的容器副本数量。
  - **默认值：** `1`。
  - **用途：** 实现服务的**高可用**和**横向伸缩**。Swarm 会自动维护指定数量的副本，当副本失败或节点宕机时，会自动创建新的副本。
- **`mode: replicated | global`**
  - **作用：** 定义服务的部署模式。
  - `replicated` (副本集，默认)：
    - 运行指定数量 (`replicas`) 的服务副本。Swarm 调度器会根据资源、负载和放置策略将这些副本分散到集群中的节点上。
  - `global` (全局)：
    - 在 Swarm 集群中的**每个可用节点**上运行一个且仅一个服务副本。
    - **用途：** 适用于需要在所有节点上都存在的服务，例如日志收集代理 (Fluentd/Promtail)、监控代理 (Node Exporter)、安全代理等。当新节点加入集群时，Swarm 会自动在新节点上启动一个该服务的副本。

##### 2. 资源限制和预留 (`resources`)

- **作用：** 管理容器可以使用的 CPU 和内存资源。这是 Swarm 调度器进行任务分配和保障服务稳定性的重要依据。
  - **`limits` (强制限制)：**
    - **`cpus: '<float>'`**: 容器可以使用的最大 CPU 核心数量。例如 `'0.5'` 表示 0.5 个 CPU 核心，即 50% 的一个核心。
    - **`memory: '<bytes>'`**: 容器可以使用的最大内存量。例如 `'512M'` (兆字节) 或 `'1G'` (千兆字节)。
    - **效果：** 如果容器尝试使用超过这些限制的资源，它可能会被限制、扼杀（CPU Throttling）甚至被终止 (OOM Kill for Memory)。这是硬性限制。
  - **`reservations` (预留)：**
    - **`cpus: '<float>'`**: 为容器预留的最小 CPU 核心数量。调度器在将任务调度到节点上时，会确保该节点有这些预留资源可用。
    - **`memory: '<bytes>'`**: 为容器预留的最小内存量。
    - **效果：** 这是一个软性保证，调度器会尽量满足，但并不强制。它主要用于调度决策，确保节点有足够的资源来启动容器。如果节点可用资源低于预留量，将不会调度新任务。

##### 3. 重启策略 (`restart_policy`)

- **作用：** 定义当服务容器退出或失败时，Swarm 应该如何尝试重启它们。

  - `condition: on-failure | any | none`

    :

    - **`on-failure`**: 仅当容器以非零退出代码（表示错误）退出时才重启。
    - **`any` (默认)**: 无论容器以何种方式退出（包括正常退出），都尝试重启。
    - **`none`**: 容器退出后不进行任何重启尝试。

  - **`delay: <duration>`**: 容器在尝试重启前的等待时间。例如 `'5s'` (5 秒)。

  - **`max_attempts: <integer>`**: 在 Swarm 放弃重启该容器前，允许的最大重启尝试次数。`0` 表示无限次尝试（默认）。

  - **`window: <duration>`**: Swarm 检查重启尝试是否失败的时间窗口。如果容器在该窗口内反复重启失败，可能会被标记为不健康。例如 `'120s'`。

##### 4. 放置约束和偏好 (`placement`)

- **作用：** 控制服务任务（容器）被调度到 Swarm 集群中哪些节点上。
  - **`constraints` (强制约束)：**
    - **作用：** 定义严格的规则，只有满足所有指定约束条件的节点才能运行该服务的任务。
    - **语法：** `- '<node_attribute> <operator> <value>'`
    - 常见属性：
      - `node.id`: 节点 ID。
      - `node.hostname`: 节点主机名。
      - `node.role`: 节点角色 (`manager` 或 `worker`)。
      - `node.labels.<label_name>`: 节点上自定义的标签。
    - 运算符：
      - `==`: 等于。
      - `!=`: 不等于。
    - 示例：
      - `- 'node.role == manager'`：只在管理器节点上运行。
      - `- 'node.labels.zone == us-east-1'`：只在带有 `zone=us-east-1` 标签的节点上运行。
      - `- 'node.hostname != node-01'`：不在 `node-01` 上运行。
  - **`preferences` (放置偏好)：**
    - **作用：** 提供软性指导，指导 Swarm 调度器如何尽量分散或集中任务，以优化性能、容错性或资源利用率。如果无法满足偏好，任务仍然会被调度。
    - **语法：** `- spread: <attribute>`
    - **`spread: node.hostname`**: 默认行为，尽量将任务分散到不同的主机上，以提高故障容错。
    - **`spread: node.labels.<label_name>`**: 尽量将任务分散到带有指定标签的不同“组”或“域”的节点上。例如，`spread: node.labels.zone` 会尽量将副本分散到不同地理区域的节点，提高区域级容错。

##### 5. 更新策略 (`update_config`)

- **作用：** 定义服务进行滚动更新时的行为。这是实现**零停机部署**的关键。

  - `parallelism: <integer>`

    : 同时更新的容器副本数量。

    - **`1` (默认)：** 每次只更新一个副本，最安全但更新速度慢。
    - **`<N>`：** 同时更新 N 个副本。

  - **`delay: <duration>`**: 更新每个批次（`parallelism` 数量的副本）之间的等待时间。例如 `'10s'`。这给新副本启动和进行健康检查留出时间。

  - `failure_action: continue | pause`

    : 如果一个新容器在更新过程中启动失败或健康检查失败，Swarm 的行为：

    - **`pause` (默认)：** 暂停整个更新过程，等待手动干预。
    - **`continue`**: 忽略失败，继续更新下一个批次。**不推荐生产环境使用，可能导致大量服务不可用。**

  - **`monitor: <duration>`**: 更新完成后，Swarm 会监控新启动的副本的健康状态，持续指定的时间。只有当该批次的副本在此期间内保持健康，才会被标记为成功，并继续更新下一个批次。例如 `'30s'`。

  - **`max_failure_ratio: <float>`**: 允许的最大失败任务比例（0.0 到 1.0 之间）。如果更新过程中失败的任务数量超过这个比例，更新可能会被中止（结合 `failure_action`）。默认 `0.0`，表示不允许任何失败。

  - `order: stop-first | start-first`

    : 更新副本时的顺序。

    - **`stop-first` (默认)：** 先停止旧容器，再启动新容器。
    - **`start-first`**: 先启动新容器，确保新容器健康后再停止旧容器。这提供了更高的可用性保障，但可能短暂地增加资源消耗（新旧容器同时运行）。

##### 6. 回滚策略 (`rollback_config`)

- **作用：** 定义当执行 `docker service rollback` 命令时，服务回滚到上一个稳定版本的行为。其属性与 `update_config` 类似。
  - **`parallelism`**: 同时回滚的容器副本数量。
  - **`delay`**: 回滚每个批次副本之间的等待时间。
  - **`failure_action`**: 如果回滚失败，是继续还是暂停。
  - **`monitor`**: 回滚后监控的时间。
  - **`max_failure_ratio`**: 允许的最大失败任务比例。
  - **`order`**: 回滚时，是先停止旧容器还是先启动新容器。

##### 7. 容器的健康检查 (`healthcheck`)

- **作用：** 定义 Swarm 如何判断一个服务容器是否“健康”并能够响应请求。这独立于 Dockerfile 中定义的 `HEALTHCHECK` 指令。
  - **`test: ["CMD", "curl", "-f", "http://localhost/healthz"]`**: 容器内执行的健康检查命令。如果命令退出代码为 0 则认为健康，非 0 则不健康。
  - **`interval: <duration>`**: 每次健康检查之间的间隔时间。例如 `'5s'` (5 秒)。
  - **`timeout: <duration>`**: 健康检查命令的超时时间。如果命令在此时间内没有返回，则认为失败。例如 `'3s'`。
  - **`retries: <integer>`**: 在将容器标记为“不健康”之前，健康检查失败的最大次数。
  - **`start_period: <duration>`**: 容器启动后，在开始执行健康检查之前等待的时间。这允许服务有足够的时间进行初始化，避免在启动阶段因服务未完全就绪而被误判为不健康。例如 `'1m'` (1 分钟)。

##### 8. 凭证获取 (`creds_spec`)

- **作用：** 指定用于从私人镜像仓库拉取镜像的凭证配置。通常通过 Docker CLI `docker login` 或 `~/.docker/config.json` 来配置。
  - **`config: <config-name>`**: 引用一个 Swarm Configs 中存储的凭证配置。
  - **`file://<path-to-file>`**: 从宿主机上的文件中读取凭证。

##### 9. 标签 (`labels`)

- **作用：** 为服务/容器添加自定义的元数据标签。

- **用途：** 这些标签不会直接影响调度，但可以被其他工具识别、分类、用于监控、日志收集或审计。

- 命名规范：

   推荐使用 

  ```yaml
  <org>.<project>.<key>
  ```

   这样的反向域名格式，以避免命名冲突。

  - 示例：

    ```yaml
    labels:
      com.example.project: myapp
      com.example.version: v1.0
    ```
  
- **与节点标签的区别：** 服务标签与用于调度决策的**节点标签** (`node.labels.<label_name>`) 是不同的概念。
