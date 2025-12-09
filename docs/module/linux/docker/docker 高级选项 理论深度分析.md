## Docker--Swarm、Service 和 Stack 的关系

- **Docker Swarm** = 把多台机器组成一个集群（统一调度、高可用、负载均衡）

- **Docker Stack** = 用一个文件（docker-compose.yml）一键部署一套包含多个服务的应用

  - 在多个服务同时创建时进行一次性创建，不用像 docker service一样一个个的创建，不过创建好服务集群之后的操作还得 service 选项来操作

- **Docker Service** 可以自己创建一个服务多个副本，然后让Swarm自动分配节点进行管理

  - **最重要的是，Service 可以对已经部署好的服务（不管是哪个集群），进行动态的拓展操作---->支持滚动更新、扩缩容、健康检查、负载均衡（内置 ingress 网络）等等操作，场景比例如下：**

    > ##### 场景1：临时扩容某个服务
    >
    > 你的 API 服务突然流量暴增，你想临时扩容到 10 个副本：
    >
    > ```shell
    > docker service scale myapp_api=10
    > ```
    >
    > → **Stack 无法单独扩容其中一个服务，你必须用 `docker service scale`。**
    >
    > ##### 场景2：滚动更新某个服务
    >
    > 你想单独更新 API 服务的镜像版本：
    >
    > ```shell
    > docker service update --image your-registry/api:v2 myapp_api
    > ```
    >
    > → Stack 虽然支持 `docker stack deploy` 重新部署，但那是“全量更新”，不够灵活。
    >
    > ###### 场景3：查看某个服务的日志或状态
    >
    > ```shell
    > docker service logs myapp_api --tail 50
    > 
    > docker service ps myapp_api
    > ```
    >
    > → Stack 没有直接查看单个服务日志的命令，必须通过 Service。
    >
    > ##### 场景4：给某个服务加 label、限制资源、绑定约束
    >
    > ```shell
    > docker service update \
    > 
    >   --limit-memory 512M \
    > 
    >   --constraint 'node.labels.type==worker' \
    > 
    >   myapp_api
    > ```
    >
    > → 这些精细化运维操作，Stack 的 compose 文件虽然能定义一部分，但**运行时动态调整必须用 service 命令。**

## 理论深度解析：理解 Docker Swarm

现在我们已经实践了Docker Swarm，让我们来解构它的核心概念和工作原理。

### 什么是 Docker Swarm？

**Docker Swarm是Docker官方提供的原生容器编排和集群管理工具。** 简单来说，它将多个Docker宿主机（物理机或虚拟机）聚合成一个虚拟的、统一的“巨型Docker引擎”。在这个集群上，你可以部署、管理和扩展你的Docker容器化应用，而无需关心它们具体运行在哪台机器上。

它提供：

- **集群管理：** 将多台主机抽象成一个单一的部署目标。
- **服务发现：** 容器可以通过服务名称互相通信。
- **负载均衡：** 请求可以自动分发到服务的多个副本。
- **高可用性：** 如果某个节点或容器失败，Swarm会自动重新调度任务。
- **零停机部署：** 支持滚动更新。

### Swarm 的核心概念

1. **节点 (Node)：**
   - Swarm集群中的每个Docker主机都被称为一个**节点**。
   - **管理节点 (Manager Node)：** 负责集群的管理和编排任务。它维护Swarm的状态、处理API请求、调度服务任务、并进行服务发现。一个Swarm集群可以有多个管理节点，以实现高可用（通常是奇数个，如3或5个，以避免“脑裂”）。
   - **工作节点 (Worker Node)：** 负责运行实际的容器（任务）。它们接收管理节点下发的任务，并向管理节点报告任务状态。工作节点不参与集群的管理。
2. **服务 (Service)：**
   - 服务是你希望在Swarm集群中运行的应用程序或任务的定义。它定义了：
     - 使用的**Docker镜像** (e.g., `nginx:latest`)。
     - **副本数量 (Replicas)** (e.g., `--replicas 3`)。
     - **端口映射** (e.g., `-p 8080:80`)。
     - **网络**、**卷**、**环境变量**等等，和Compose文件中的概念类似。
   - 服务是Docker Swarm最核心的部署单元。
3. **任务 (Task)：**
   - **任务是服务的一个运行实例。** 当你创建一个服务并指定了副本数量，Swarm会为每个副本创建一个任务。
   - 每个任务对应一个**容器**。如果容器因为某种原因停止，Swarm会尝试在另一个节点上启动一个新的任务来替代它，以保持服务所需的副本数量。
4. **路由网格 (Routing Mesh / Ingress Network)：**
   - 这是Swarm的一个强大特性。当你将一个服务的端口发布到Swarm集群时（例如 `-p 8080:80`），Swarm会在集群中的**所有节点**上打开这个端口。
   - 无论你访问哪个节点的这个端口，请求都会被路由网格自动转发到正在运行该服务副本的任何一个容器上。这实现了**自动的负载均衡**和**高可用性**。即使访问的节点上没有运行该服务的容器，请求也会被转发到运行有该服务的其他节点上的容器。
5. **Overlay 网络：**
   - Docker Swarm创建并管理**Overlay网络**，允许在不同节点上的容器之间进行通信，就像它们在同一个局域网中一样。
   - 这解决了跨主机容器通信的复杂性。
6. **栈 (Stack)：**
   - 对于更复杂的、由多个服务组成的应用程序（比如我们的Web应用+数据库），我们可以使用一个特殊的Docker Compose文件（通常称为`docker-compose.yml`，但用于Swarm部署时，我们称之为**栈文件**或**Compose文件**）来定义整个应用程序。
   - 然后使用 `docker stack deploy` 命令将整个应用程序部署为一个**栈**。栈包含了多个相关的服务，这使得管理多服务应用变得非常方便。
   - **重要区别：** 虽然文件格式和Docker Compose类似，但 `docker stack deploy` 是面向Swarm集群的，它部署的是服务，而不是在单机上运行容器。

## 理论深度解析：理解 Docker Service

### 什么是 Docker Service？

​	在Docker Swarm中，**Service 是你希望在集群中运行的应用程序的定义。** 它不是一个单独的容器，而是一个抽象，描述了你想要实现的目标状态（desired state）。这个目标状态包括：

- **哪个镜像？** (e.g., `nginx:latest`)
- **多少个副本？** (e.g., `--replicas 3`)
- **如何暴露端口？** (e.g., `-p 80:80`)
- **如何与内部网络通信？**
- **如何持久化数据？**
- **如何在集群中分发？** (通过约束、放置偏好等)
- **如何更新？** (滚动更新策略)

​	当你在Swarm中创建一个Service时，Swarm 管理节点会负责确保实际运行的容器实例（被称为**任务 Task**）与Service的定义保持一致。如果一个任务失败，或者一个节点下线，Swarm会自动重新调度任务以维护所需的服务状态。

### Service 的核心特性和概念

1. **目标状态管理 (Desired State Management)：** 这是Service最重要的概念。你告诉Swarm你想要**什么**（目标状态），而不是**怎么做**。Swarm负责将集群的实际状态驱动到你定义的目标状态。
   - 例如，你定义 `replicas=5`，Swarm就会一直努力保持5个副本运行。
2. **任务 (Tasks)：**
   - 每个Service副本都由一个或多个**任务 (Task)** 组成。通常，一个任务对应一个容器。
   - 当Service被创建或扩展时，Swarm管理节点会生成任务。
   - 工作节点接收任务并运行相应的容器。
   - 任务是不可变的。如果一个任务需要更新（例如，镜像版本更新），Swarm会停止旧任务并创建一个新任务来替换它。
3. **副本集 (Replicated Services) 与 全局服务 (Global Services)：**
   - **副本集服务 (Replicated Services)** (我们刚才使用的): 这是最常见的类型，你指定一个固定的副本数量（`--replicas N`）。Swarm会在集群中调度这些副本，力求均匀分布，并在需要时重新平衡。
   - **全局服务 (Global Services)** (`--mode global`): 这种服务会在Swarm集群中的**每个可用节点**上运行一个且仅一个副本。适用于监控代理、日志收集器（如 Prometheus Node Exporter, Fluentd）等需要在每台机器上都运行的应用。
4. **发布端口和路由网格 (Routing Mesh)：**
   - 当你使用 `-p <HOST_PORT>:<CONTAINER_PORT>` 发布Service端口时，Swarm的路由网格（Ingress Overlay Network）会在**集群中的所有节点上**监听 `HOST_PORT`。
   - 当请求到达任何一个节点的 `HOST_PORT` 时，路由网格会将其转发到集群中**任意一个正在运行该Service的健康容器**。
   - 这提供了内建的负载均衡和高可用性，外部客户端无需知道哪个节点实际运行了容器。
5. **滚动更新 (Rolling Updates)：**
   - 当你更新Service的配置（例如，镜像版本、环境变量等）时，Swarm会默认执行滚动更新。
   - 它会逐步停止旧的容器，并启动新的容器，以最小化停机时间。你可以配置更新的策略，例如：
     - `--update-delay`: 每次更新之间的延迟时间。
     - `--update-parallelism`: 同时更新多少个副本。
     - `--update-failure-action`: 更新失败时的行为（`pause` 暂停或 `continue` 继续）。
     - `--rollback-monitor`: 监控更新后任务的健康状况。
     - `--rollback-max-failure-ratio`: 允许的最大失败任务比例。
6. **服务发现 (Service Discovery)：**
   - Swarm内置了DNS服务发现。在同一个Swarm网络中的容器可以通过Service名称相互通信。
   - 例如，一个Web服务可以直接通过 `database-service-name` 来访问数据库服务，而不需要知道数据库容器的IP地址。
7. **服务约束 (Service Constraints) 和放置偏好 (Placement Preferences)：**
   - **约束 (`--constraint`)：** 严格地限制服务只能在满足特定条件的节点上运行。条件基于节点标签（`node.labels.<label_name>`）、节点ID（`node.id`）、节点主机名（`node.hostname`）等。
   - **放置偏好 (`--placement-pref`)：** 是一种软约束，用于指导Swarm如何分散或集中任务。例如，`--placement-pref 'spread=node.labels.zone'` 会尽量将副本分散到不同 `zone` 标签的节点上。
8. **服务网络：**
   - 服务可以连接到一个或多个**Overlay网络**。这些网络允许跨节点的容器通信。
   - `--network <network_name>` 参数用于指定Service连接的网络。

### `docker service` 命令的常用参数速查

- 创建服务：

  ```
  docker service create [OPTIONS] IMAGE [COMMAND] [ARG...]
  ```

  - `--name`: 服务名称。
  - `-p <HOST_PORT>:<CONTAINER_PORT>`: 端口映射。
  - `--replicas N`: 副本数量（用于副本集服务）。
  - `--mode global`: 全局服务（每个节点一个副本）。
  - `--network`: 连接到指定网络。
  - `--constraint`: 节点约束条件。
  - `--mount type=bind,source=...,target=...`: 挂载绑定卷。
  - `--mount type=volume,source=...,target=...`: 挂载命名卷。
  - `-e KEY=VALUE`: 设置环境变量。
  - `--env-file <file_path>`: 从文件加载环境变量。

- 查看服务：

  - `docker service ls`: 列出所有服务。
  - `docker service ps <service_name>`: 列出服务的所有任务（副本）。
  - `docker service inspect <service_name>`: 查看服务的详细配置。

- **伸缩服务：** `docker service scale <service_name>=N`

- 更新服务：

  ```
  docker service update [OPTIONS] <service_name>
  ```

  - `--image`: 更新镜像。
  - `--env-add`, `--env-rm`: 添加/移除环境变量。
  - `--force`: 强制更新（即使配置未变）。
  - `--update-*`: 各种更新策略参数。

- **回滚服务：** `docker service rollback <service_name>`

- **删除服务：** `docker service rm <service_name>`

------

### “Service专家”测试

现在你对Docker Service有了全面的理解，是时候进行一些更有趣的挑战了：

1. 高可用数据库服务：

    尝试部署一个带有持久化存储的数据库服务（例如 MariaDB 或 PostgreSQL），并将其副本设置为2或3。思考如何确保数据一致性（这通常需要外部工具或数据库本身的功能，Swarm只负责容器的调度，不负责数据同步）。

   - 提示：你需要定义一个命名卷，并确保数据库容器可以挂载它。
   - 思考：如果只有一个命名卷，多个副本如何共享？（这通常需要专门的分布式文件系统或数据库的高可用方案，Docker Swarm本身只提供持久卷的调度能力）。

2. 混合服务类型：

    部署一个组合应用程序：

   - 一个Web服务（副本集，3个副本）。
   - 一个日志收集器服务（全局服务，确保每个节点都有一个）。
   - 确保它们通过Overlay网络相互通信。

3. 自定义更新策略：

   - 创建一个服务，并为其配置缓慢的滚动更新策略（例如，`--update-delay 10s --update-parallelism 1`）。
   - 尝试更新服务，并观察它是如何一个接一个地进行更新的。
   - 故意引入一个会导致容器启动失败的错误（例如，错误的镜像名称），观察 `update-failure-action` 的效果。

## 理论深度解析：理解 Docker Stack

### 什么是 Docker Stack？

​	**Docker Stack 是一种高级部署工具，它允许你将一个完整的、由多个相关联的服务组成的应用程序（通常使用一个 Docker Compose 文件定义）作为一个单一的实体部署到 Docker Swarm 集群中。**

简而言之：

- **Docker Compose** 解决了**单机多容器**的编排问题。
- **Docker Stack** 解决了**多主机集群多服务应用**的编排问题，并且它使用了与 Docker Compose 兼容的 YAML 文件格式。

当你使用 `docker stack deploy` 命令时，Docker Swarm 会读取你的 Compose 文件，并将其中的每个 `service` 定义转换为一个 Docker Swarm Service。这意味着你在 Compose 文件中为每个服务定义的 `ports`、`networks`、`volumes`、`environment`，以及专门为 Swarm 设计的 `deploy` 配置，都会被 Swarm 识别和执行。

### Stack 的核心价值和优势：

1. **统一的应用程序管理：**
   - 将整个应用程序（多个微服务、数据库、缓存等）视为一个独立的单元进行部署和管理。
   - 一条命令即可部署整个应用程序：`docker stack deploy`。
   - 一条命令即可更新整个应用程序：`docker stack deploy` (再次运行即可)。
   - 一条命令即可删除整个应用程序：`docker stack rm`。
   - 这极大地简化了复杂应用的生命周期管理。
2. **兼容 Compose 文件格式：**
   - 你可以直接使用或稍作修改（添加 `deploy` 部分）你熟悉的 `docker-compose.yml` 文件来部署到生产级的 Swarm 集群。
   - 这意味着开发环境（Docker Compose）和生产环境（Docker Swarm Stack）可以使用**相同的文件定义**，提高了环境的一致性和开发效率（“同构部署”）。
3. **服务编排能力：**
   - Stack 利用了 Docker Swarm 的所有服务编排能力，包括：
     - **高可用性：** 根据 `replicas` 自动维持副本数量。
     - **负载均衡：** 利用路由网格自动分发请求。
     - **服务发现：** 容器可以通过服务名（通常是 `stackname_servicename`）互相通信。
     - **滚动更新：** 平滑地更新服务而不会中断。
     - **资源调度：** 根据资源需求和节点标签将服务任务调度到最佳节点。
     - **Secret 和 Configs 管理：** 可以在 Stack 中定义和使用敏感数据（Secret）和非敏感配置（Config）。
4. **命名空间隔离：**
   - 每个 Stack 都有一个独立的命名空间。Stack 中的服务、网络、卷等都会以 `stack_name` 作为前缀。例如，我们的 `web` 服务会变成 `myapp_web`，`app-net` 网络会变成 `myapp_app-net`。
   - 这有助于防止不同应用程序（Stack）之间的命名冲突，并提供了清晰的资源分组。

### `docker-compose.yml` 在 Compose 和 Stack 模式下的差异：

虽然是同一个文件，但 Docker Compose 和 Docker Swarm Stack 对其中某些字段的处理方式不同：

| 字段/特性     | `docker compose up` (单机)                           | `docker stack deploy` (Swarm)                                |
| ------------- | ---------------------------------------------------- | ------------------------------------------------------------ |
| `ports`       | 将主机端口映射到容器端口。                           | Swarm 服务发布端口，通过路由网格实现跨节点负载均衡。         |
| `networks`    | 在宿主机上创建 Bridge 网络。                         | 在 Swarm 中创建 Overlay 网络，允许跨节点通信。               |
| `volumes`     | 创建命名卷或绑定挂载到宿主机。                       | 创建 Swarm 共享的命名卷，并调度到节点。绑定挂载依然是针对特定节点。 |
| `depends_on`  | 严格的启动顺序依赖（容器启动后才启动依赖它的容器）。 | **仅限于 Swarm 模式下服务调度时的提示**，不保证依赖服务内部进程已“就绪”（如数据库已启动并监听端口）。需配合健康检查或应用程序重试。 |
| `build`       | 构建本地 Dockerfile 镜像。                           | 管理节点构建镜像或拉取远端镜像。生产中通常推荐预先构建并推送到镜像仓库。 |
| **`deploy`**  | **忽略**（仅用于 Swarm 模式）。                      | **核心配置！** 定义服务在 Swarm 中的副本数、重启策略、更新策略、资源限制、调度约束等。 |
| **`secrets`** | 支持（但通常是文件挂载）。                           | **推荐方式**，Swarm 内置安全 Secret 管理。                   |
| **`configs`** | 支持（但通常是文件挂载）。                           | **推荐方式**，Swarm 内置配置管理。                           |

### 何时使用 `docker stack`？

当你需要：

- 在**多台服务器**上部署和运行你的应用程序。
- 实现应用程序的**高可用性、容错性和自动恢复**。
- 轻松地**伸缩**应用程序的各个组件。
- 执行**零停机时间的服务更新**。
- 将一个复杂的应用程序视为一个**单一的、可管理单元**来部署和管理。
- 利用 Docker Swarm 的所有高级功能（服务发现、路由网格、Secret/Config）。

​	简而言之，`docker stack` 是将你的 Docker Compose 应用推向生产级 Swarm 集群的官方且推荐的方式。

------

### “Stack 大师”测试

1. **部署一个更复杂的栈：**

   - 尝试部署一个带有 `frontend` (Web UI, 如 Vue.js/React App 的 Nginx 静态服务)、`backend` (API 服务, 如 Node.js/Python Flask)、`database` (PostgreSQL) 的三层应用。
   - 为每个服务配置合适的 `replicas` 和 `deploy` 策略。
   - 确保它们通过自定义的 `overlay` 网络通信。
   - 尝试使用 `docker stack rm` 移除整个应用程序。

2. **使用 Secret 和 Configs：**

   - 修改你的 `docker-compose.yml` 文件，使用 Docker Swarm 的 Secret 和 Configs 来管理数据库密码和应用程序配置。
   - `docker secret create my_db_password <(echo "your_secret_password")`
   - `docker config create my_app_config ./app.conf`
   - 然后在 `docker-compose.yml` 的 `services` 下引用这些 Secret 和 Configs。
   - 重新部署栈，并验证配置是否正确注入到容器中。

3. **强制更新 (Force Update)：**

   - 在不改变 `docker-compose.yml`文件的情况下，尝试强制更新一个服务：

     - `docker service update --force <service_name>`
     - 或者整个栈：`docker stack deploy -c docker-compose.yml --prune myapp` ( `--prune` 可以删除在Compose文件中不再存在的服务，但要小心使用)
