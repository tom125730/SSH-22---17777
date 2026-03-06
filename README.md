# GOST 转发面板

一个纯前端的 GOST 转发管理面板，可在浏览器中维护规则并生成命令与配置。

## 功能

- 新增/编辑/删除转发规则
- 启用或停用单条规则
- 自动生成 `gost -L` 启动命令
- 自动生成 `config.json` 示例
- 导入/导出规则 JSON
- 本地持久化（`localStorage`）

## 本地运行

```bash
python3 -m http.server 8000
```

然后打开 `http://localhost:8000`。

## Docker 封装

### 1) 构建镜像

```bash
docker build -t gost-forward-panel:latest .
```

### 2) 运行容器

```bash
docker run -d --name gost-forward-panel -p 8080:80 --restart unless-stopped gost-forward-panel:latest
```

访问：`http://localhost:8080`

### 3) 使用 Docker Compose

```bash
docker compose up -d --build
```

## GitHub Release（自动发布）

仓库已添加 GitHub Actions 工作流：当你推送语义化标签（如 `v1.0.0`）时会自动：

1. 构建并推送多架构镜像到 GHCR
2. 创建 GitHub Release

### 触发发布

```bash
git tag v1.0.0
git push origin v1.0.0
```

发布后你将在 GitHub 的 **Releases** 页面看到对应版本。


### 一键修复 origin 并发布（推荐）

仓库内置脚本：

```bash
./scripts/release.sh v1.0.0 git@github.com:<owner>/<repo>.git
```

或使用环境变量：

```bash
REPO_URL=https://github.com/<owner>/<repo>.git ./scripts/release.sh v1.0.0
```

脚本会自动：
1. 检查并补齐 `origin`
2. 创建标签（若不存在）
3. 推送分支与标签，触发 GitHub Release 工作流


## 手动发布镜像（示例）

> 将 `YOUR_NAMESPACE` 替换为你的 Docker Hub / GHCR 命名空间。

### 发布到 Docker Hub

```bash
docker tag gost-forward-panel:latest YOUR_NAMESPACE/gost-forward-panel:latest
docker push YOUR_NAMESPACE/gost-forward-panel:latest
```

### 发布到 GHCR

```bash
docker tag gost-forward-panel:latest ghcr.io/YOUR_NAMESPACE/gost-forward-panel:latest
docker push ghcr.io/YOUR_NAMESPACE/gost-forward-panel:latest
```
