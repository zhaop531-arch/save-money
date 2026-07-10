# 花钱省钱账本

一个可以放到 GitHub Pages 的个人开销记录网页。它支持：

- 自然语言输入开销
- DeepSeek API 分析输入
- 离线规则分析，没填 API key 也能用
- 本地浏览器保存数据
- 月预算、分类统计、省钱建议
- CSV 导入导出和 JSON 备份

## 使用方式

直接打开 `index.html` 就能使用。未连接 Firebase 前，数据保存在浏览器 `localStorage`，换浏览器或清缓存会丢失。连接 Firebase 并登录后，开销记录会保存到 Firestore。

手机端也是一样：登录同一个 Google 账号后，会读取同一个 Firebase 账号下的历史记录。DeepSeek API key 只保存在当前浏览器，保存一次后下次打开会自动填回，不会放进 JSON 导出文件。

## Firebase 云端同步

Firebase 配置需要从控制台复制一次，粘贴到网页的“设置” -> “Firebase 云端同步”里保存。Firebase 控制台还需要完成这些步骤：

1. 在项目设置里找到 Web 应用，复制完整 `firebaseConfig`。
2. 在 Firebase 控制台启用 Authentication，登录方式选择 Google。
3. 在 Authentication 的授权网域里加入你的 GitHub Pages 域名，例如 `zhaop531-arch.github.io`。
4. 在 Firestore Database 里创建数据库。
5. Firestore 规则建议使用：

```txt
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

登录后，数据路径是：

```txt
users/{你的Firebase用户ID}/records/{记录ID}
```

页面里的“导出全部 JSON”和“导出 CSV”会导出当前账号下已加载的全部历史记录。

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
