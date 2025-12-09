# Vitepress github部署

**把版本较低的情况下可以参观这两个网址进行部署：**

**[一个名叫QianFan的技术博主](https://blog.mapin.net/posts/GitHub%20Action%E4%B8%80%E9%94%AE%E9%83%A8%E7%BD%B2%E4%B8%AA%E4%BA%BA%E5%8D%9A%E5%AE%A2)**

**[程序员Zero的博客](https://www.bugdesigner.cn/archives/vitepressda-jian-bing-bu-shu-wang-zhan#)**

**版本较高的情况下可以进行 AI 搜索 配置**

1. **先给出vitepress package.json配置,然后再进行描述（比如：我想在github pages部署vitepress，给出一个deploy配置）**

**后续就是ai给我的内容，可以参考：**

​	这是一个非常标准且推荐的**GitHub Actions**部署方案。它会在你每次推送到 `main` 分支时，自动构建并发布到 GitHub Pages。

请按照以下 3 个步骤操作：

### 第一步：设置 Base 路径 (非常重要！)

GitHub Pages 的默认地址通常是 `https://你的用户名.github.io/你的仓库名/`。如果不设置 `base`，CSS 和 JS 路径会断裂，导致页面样式丢失。

修改你的 `docs/.vitepress/config.mjs`：

```javascript
export default defineConfig({
  // 务必修改这里！如果不放在根目录下，必须设置 base
  // 假设你的仓库名叫 "my-docs"，这里就填 "/my-docs/"
  // 如果你的仓库名就叫 "你的用户名.github.io"，则不需要这行（或者填 '/'）
  base: '/你的仓库名/', 
  
  // ... 其他配置保持不变
})
```

### 第二步：创建 GitHub Actions 脚本

**具体操作可以参考上面两个博主教学,坑: 因为版本不一致出现了一点问题**

在你的项目根目录下，创建目录和文件： `.github/workflows/deploy.yml`

将以下内容复制进去：

```yaml
# .github/workflows/deploy.yml
name: Deploy VitePress site to Pages

on:
  # 当推送到 main 分支时触发，如果你是 master 分支请修改这里
  push:
    branches: [main]

  # 允许手动在 Actions 页面触发
  workflow_dispatch:

# 设置权限，允许 GITHUB_TOKEN 修改 Pages
permissions:
  contents: read
  pages: write
  id-token: write

# 只允许同时进行一个部署任务，跳过正在进行的旧任务
concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  # 构建任务
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # 如果你用了 lastUpdated 也就是最后更新时间功能，需要设为 0

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm # 自动缓存依赖，加快构建速度

      - name: Install dependencies
        run: npm ci # 使用 ci 安装依赖更稳定

      - name: Build with VitePress
        run: npm run docs:build # 这里对应你 package.json 里的脚本

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          # 注意：这是 VitePress 默认的构建输出目录
          path: docs/.vitepress/dist

  # 部署任务
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 第三步：在 GitHub 仓库中开启权限

1. 将代码提交并推送到 GitHub。
2. 进入你的 GitHub 仓库页面。
3. 点击顶部的 **Settings** (设置)。
4. 在左侧侧边栏找到 **Pages**。
5. 在 **Build and deployment** (构建与部署) 区域：
   - **Source** 选择 **GitHub Actions** (这一步最关键)。
6. 如果你配置正确，GitHub Actions 会自动开始运行。你可以点击仓库顶部的 **Actions** 标签查看进度。

### 常见问题排查

- **样式丢失/404**：99% 的情况是因为第一步的 `base` 配置错了。请确保 `base` 的值和你 GitHub 仓库的名字完全一致，并且前后都要有斜杠（例如 `/my-project/`）。
- **分支名不对**：如果你的主分支叫 `master` 而不是 `main`，请修改 `deploy.yml` 中的 `branches: [main]` 为 `branches: [master]`。