## 实践环节：亲身体验 Docker Overlay 网络

​	为了更好地演示Overlay网络，我们最好在一个多节点的 Docker Swarm 集群中进行（你可以使用我们上次模拟的三台虚拟机，或者至少两台机器组成的Swarm）。如果你目前只有一台机器，我也会提供单机模拟的步骤，但多机体验更佳。

**前提条件：**

- 一个已初始化的 Docker Swarm 集群（至少包含一个管理节点和至少一个工作节点）。
- 确保所有节点之间的防火墙允许 Docker Swarm 必要的端口通信（通常是 TCP 2377, TCP/UDP 7946, UDP 4789）。

### 实验一：创建和验证 Overlay 网络

1. 在管理节点上操作：

   首先，我们来创建一个自定义的Overlay网络。

   ```bash
   docker network create --driver overlay --attachable my-overlay-network
   ```
   
   - `docker network create`: 创建一个网络。
   - `--driver overlay`: 指定网络驱动为 `overlay`。这是关键！
   - `--attachable`: 这个选项很重要！它允许非服务模式的独立容器（例如通过 `docker run` 启动的容器）也可以连接到这个Overlay网络。如果省略这个，只有通过 `docker service create` 创建的服务才能连接。
   - `my-overlay-network`: 我们给这个网络起的名字。
   
2. 验证 Overlay 网络是否在所有节点上可用：

   现在，登录到你的任何一个工作节点，并查看网络列表：

   ```bash
   docker network ls
   ```
   
   你会发现 `my-overlay-network` 已经自动出现在了所有节点上。这是因为Overlay网络是Swarm管理和分发到所有成员的。

   ```bash
   NETWORK ID     NAME                  DRIVER    SCOPE
   xxxxxxxxxx     bridge                bridge    local
   xxxxxxxxxx     docker_gwbridge       bridge    local
   xxxxxxxxxx     host                  host      local
   xxxxxxxxxx     ingress               overlay   swarm     # 这是默认的 Swarm Ingress 网络
   xxxxxxxxxx     my-overlay-network    overlay   swarm     # 你的自定义 Overlay 网络
   xxxxxxxxxx     none                  null      local
   ```
   
   注意 `SCOPE` 列显示为 `swarm`，表明它是集群范围的网络。

### 实验二：在 Overlay 网络中部署服务并实现跨主机通信

我们将部署两个服务：一个 `web` 服务和一个 `app` 服务，让它们通过 `my-overlay-network` 进行通信。

1. 在管理节点上操作：

   创建 app 服务（一个简单的netcat容器，监听端口并回显消息）：

   ```bash
   docker service create \
     --name my-app \
     --network my-overlay-network \
     --replicas 1 \
     alpine/git sh -c "apk add --no-cache netcat-openbsd && while true; do echo -e 'HTTP/1.1 200 OK\n\nHello from my-app on $(hostname)!' | nc -l -p 8080; done"
   ```
   
   - `--network my-overlay-network`: 将 `my-app` 服务连接到我们创建的Overlay网络。
   - `apk add --no-cache netcat-openbsd ...`: 容器启动后运行一个简单的 `netcat` 服务器，监听8080端口并返回一条包含主机名的消息。
   
   创建 `web` 服务（一个Nginx容器，尝试访问 `my-app`）：

   ```bash
   docker service create \
     --name my-web \
     --network my-overlay-network \
     -p 80:80 \
     nginx:latest
   ```
   
   - 同样连接到 `my-overlay-network`。
   - `-p 80:80`: 暴露Nginx的80端口到宿主机的80端口（通过路由网格）。
   
2. **验证服务分布（可选，多机环境看效果）：**

   ```bash
docker service ps my-app
   docker service ps my-web
   ```
   
   你可能会看到 `my-app` 和 `my-web` 部署在不同的节点上。**这就是Overlay网络的威力所在：即使它们在不同机器上，也能通过服务名称互相访问。**

3. 测试服务间通信：

   现在，我们将进入 my-web 服务的Nginx容器内部，尝试访问 my-app 服务。

   a. **找到 `my-web` 容器的ID或名称：**

   ```bash
   docker service ps my-web
   # 找到 "CURRENT STATE" 为 "Running" 的任务ID，例如 my-web.1.xxxxxxxxxxxx
   # 然后找到它运行的节点HOSTNAME。登录到那个节点上。
   ```
   
   b. 进入 my-web 容器的Shell：

   登录到运行着 my-web 容器的节点上。然后执行：

   ```bash
   docker ps | grep my-web # 找到 my-web 容器的 CONTAINER ID
   docker exec -it <CONTAINER_ID> bash
   ```
   
   c. 在 my-web 容器内测试访问 my-app：
   
   在 my-web 容器的shell中，使用 curl 访问 my-app 服务。注意，我们直接使用服务名称 my-app，而不是IP地址！

   ```bash
   curl http://my-app:8080
   ```

   你应该会看到 `my-app` 容器返回的消息，例如 `Hello from my-app on <app-container-hostname>!`。

   **这个结果至关重要！** 它证明了即使 `my-web` 容器和 `my-app` 容器运行在不同的物理主机上，它们也能通过Docker Swarm的内置DNS服务发现机制，通过服务名称在Overlay网络中顺利通信。这就是Overlay网络的核心价值之一。

### 实验三：连接独立容器到 Overlay 网络 (需要 `--attachable`)

1. 在管理节点上操作：

   创建一个普通的独立容器，并将其连接到 my-overlay-network。

   ```
   docker run -it --name my-standalone-container --network my-overlay-network alpine/git sh
   ```
   
   - `-it`: 交互式模式。
   - `--name my-standalone-container`: 容器名称。
   - `--network my-overlay-network`: 连接到Overlay网络。
   - `alpine/git sh`: 运行一个shell。
   
2. 在独立容器内测试通信：

   进入 my-standalone-container 的shell后，尝试访问 my-app 服务。

   ```
   apk add --no-cache curl # 安装 curl
   curl http://my-app:8080
   ```
   
   你应该也能看到 `my-app` 返回的消息。这证明了即使是非Swarm服务的独立容器，只要连接到同一个Overlay网络，也能和Swarm服务进行通信。

### 实验四：清理环境

1. **在管理节点上操作：**

   ```bash
   docker service rm my-app my-web
   docker rm -f my-standalone-container # 停止并移除独立容器
   docker network rm my-overlay-network # 移除Overlay网络
   ```

   确保 `docker network ls` 不再显示 `my-overlay-network`。

2. **如果 Swarm 不再需要，可以离开集群：**

   ```bash
   docker swarm leave --force # 在管理节点上
   docker swarm leave # 在工作节点上
   ```

------

## 理论深度解析：理解 Docker Overlay 网络

### 什么是 Docker Overlay 网络？

**Docker Overlay 网络是一种虚拟网络，它允许 Docker 容器在不同的 Docker 主机（节点）之间进行通信，就好像它们连接在同一个局域网中一样。**

在传统的网络中，不同主机上的容器默认是无法直接通信的。Overlay网络解决了这个问题，它“覆盖”在现有的物理网络之上，为跨主机的容器提供了逻辑上的直连。

### Overlay 网络的工作原理 (基于 VXLAN)

Docker Overlay 网络通常使用 **VXLAN (Virtual eXtensible LAN)** 技术来实现。以下是其核心工作原理的简化解释：

1. **虚拟网络接口：**

   - 当你在Swarm中创建Overlay网络并连接容器时，Docker会在每个参与的容器中创建一个虚拟网络接口，并分配一个IP地址（来自Overlay网络的CIDR）。
   - 这些虚拟接口通过一个特殊的网桥（通常是 `docker_gwbridge`，用于连接宿主机和Overlay网络）连接到宿主机的物理网络。

2. **隧道封装 (Tunneling / Encapsulation)：**

   - 当一个容器（例如 `web-container` 在 `Host A` 上）想要向另一个容器（例如 `app-container` 在 `Host B` 上）发送数据包时，即使它们在不同的主机上，它们也认为自己在同一个逻辑网络中。

   - 当数据包从 `web-container` 发出并到达 `Host A` 上的Docker网络层时，Docker会识别出目标 `app-container` 位于另一个主机 `Host B` 上。

   - Docker（或更准确地说，是底层的网络组件，如 和内核模块）会将这个数据包封装

     ```bash
     libnetwork
     ```

     在一个新的UDP数据包中。这个封装包含了：

     - **原始数据包：** `web-container` 到 `app-container` 的数据。
     - **VXLAN 头：** 包含了虚拟网络标识符 (VNI)，就像一个虚拟的 VLAN ID，确保数据包属于正确的Overlay网络。
     - **新的外部 IP 头：** 源IP是 `Host A` 的物理IP，目标IP是 `Host B` 的物理IP。
     - **新的外部 UDP 头：** 通常使用 UDP 端口 4789（VXLAN默认端口）。

3. **物理网络传输：**

   - 封装后的UDP数据包通过底层的物理网络（你的服务器的真实网卡和网络设备）从 `Host A` 传输到 `Host B`。对于物理网络来说，它只是一个普通的UDP数据包。

4. **解封装 (Decapsulation)：**

   - `Host B` 收到这个UDP数据包后，Docker会识别出它是VXLAN封装的数据包。
   - Docker会**解封装**这个数据包，移除外部的UDP头和VXLAN头，还原出原始的、属于Overlay网络的数据包。
   - 这个原始数据包随后被转发到 `Host B` 上的 `app-container`。

**结果就是：** `web-container` 和 `app-container` 彼此之间无感知地实现了跨主机通信，就像它们在同一台机器上的Bridge网络中一样。

### Overlay 网络的优势和特点：

1. **跨主机通信：** 这是最核心的优势，解决了容器化应用程序在分布式环境中扩展的根本问题。
2. **服务发现：** 结合 Docker Swarm 的内置 DNS，容器可以通过服务名称而不是 IP 地址进行通信。当服务扩展或容器IP变化时，DNS会自动更新。
3. **简化网络配置：** 开发者无需关心底层物理网络的复杂性，只需将服务连接到同一个Overlay网络即可。
4. **隔离性：** 不同的Overlay网络之间是相互隔离的，有助于构建安全的多租户环境。
5. **路由网格基础：** Overlay网络是 Docker Swarm 路由网格的基础。路由网格通过在所有节点上暴露Service端口，并将流量通过Overlay网络转发到实际运行的容器。
6. **安全：** Docker 守护进程之间的通信通过 TLS 加密保护。

### 常见的 Docker 网络类型回顾：

- **`bridge` (默认):** 单主机容器通信。容器连接到宿主机上的一个虚拟网桥，可以在同一台主机上的容器之间通信，并可访问外部网络（通过NAT）。
- **`host`:** 容器直接共享宿主机的网络命名空间。容器直接使用宿主机的IP地址和端口。性能最高，但隔离性最差，容易端口冲突。
- **`none`:** 容器没有网络接口。完全隔离，通常用于只执行一次性任务或需要严格控制网络的应用。
- **`overlay`:** **多主机容器通信**。用于 Docker Swarm 模式，允许容器跨越多个主机进行通信。
- **`macvlan`:** 为容器分配独立的MAC地址，使其在物理网络上表现得像独立的物理设备。可以用于高性能场景或需要直接连接到物理网络的场景。

### `ingress` Overlay 网络：

​	你可能会注意到在 `docker network ls` 输出中有一个名为 `ingress` 的Overlay网络。这是 Docker Swarm **默认的路由网格网络**。当你使用 `-p` 参数发布服务端口时，Swarm 会自动将服务连接到 `ingress` 网络，从而启用路由网格功能。你通常不需要手动管理 `ingress` 网络。

------

#### “Overlay 网络专家”挑战！

1. **网络隔离测试：**
   - 创建两个独立的Overlay网络：`network-a` 和 `network-b`。
   - 创建一个 `service-a` 连接到 `network-a`。
   - 创建一个 `service-b` 连接到 `network-b`。
   - 尝试从 `service-a` 的容器内部 `ping` `service-b` 的服务名称。验证它们是否无法通信（因为不在同一个网络）。
   - 然后，创建一个 `service-c`，同时连接到 `network-a` 和 `network-b`。
   - 从 `service-c` 内部尝试 `ping` `service-a` 和 `service-b`。验证 `service-c` 能否同时访问这两个服务。
2. **故障模拟与自愈：**
   - 在一个多节点Swarm集群中，创建一个带有多副本的服务（例如 3 个副本），并连接到一个自定义的Overlay网络。
   - 拔掉一个工作节点的网线（模拟网络故障）或直接关闭一个工作节点。
   - 观察 `docker service ps`，看看Swarm如何将故障节点上的任务重新调度到健康的节点上。
   - 再次测试服务是否仍然可用，体验Overlay网络和路由网格在故障恢复中的作用。
3. **理解 `docker_gwbridge`：**
   - 仔细观察你的节点，`docker network ls` 会显示 `docker_gwbridge`。
   - 查阅资料，理解 `docker_gwbridge` 的作用，它如何连接Swarm节点内部的Bridge网络与外部物理网络以及Overlay网络。