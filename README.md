# 花钱省钱账本

一个可以放到 GitHub Pages 的个人开销记录网页。它支持：

- 自然语言输入开销
- DeepSeek API 分析输入
- 离线规则分析，没填 API key 也能用
- 本地浏览器保存数据
- 月预算、分类统计、省钱建议
- CSV 导入导出和 JSON 备份

## 使用方式

直接打开 `index.html` 就能使用。数据保存在浏览器 `localStorage`，换浏览器或清缓存会丢失，请定期用“备份 JSON”导出。

## DeepSeek API

在“设置”里填入 API key。当前默认配置：

- API 地址：`https://api.deepseek.com/chat/completions`
- 模型：`deepseek-v4-flash`

注意：如果这个网页部署在 GitHub Pages 这类静态网站上，API key 会保存在你的浏览器里，前端请求也可能被他人从浏览器开发者工具看到。个人自用可以接受；如果要给别人用，建议加一个后端代理，例如 Cloudflare Worker、Vercel Function 或自己的服务器。

如果浏览器提示跨域请求失败，说明 DeepSeek API 不允许当前静态网页直接访问。页面会自动改用离线分析；要继续使用 AI 分析，也需要加后端代理。

## 发布到 GitHub Pages

1. 新建一个 GitHub 仓库。
2. 上传 `index.html`、`styles.css`、`app.js`、`README.md`。
3. 打开仓库 `Settings` -> `Pages`。
4. Source 选择 `Deploy from a branch`。
5. Branch 选择 `main`，目录选择 `/root`。
6. 保存后等待部署，GitHub 会给你一个 `https://用户名.github.io/仓库名/` 的网址。
