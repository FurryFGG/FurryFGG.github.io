# FurryFGG 风光狗的个人网站

这是一个无需构建工具的静态网站，可直接部署到 GitHub Pages。

## 本地预览

直接打开 `index.html` 可以查看基础页面。为了完整测试站内链接和浏览器功能，也可以在项目目录启动任意静态文件服务器。

## 更新摄影作品

当前版本不加载任何图片。后续添加作品时，建议将照片导出为 WebP，长边控制在 2000 像素以内、单张小于 500 KB，再放入 `assets/images/portfolio/` 并替换 `index.html` 中的摄影占位内容。

## 发布

仓库目标：<https://github.com/FurryFGG/FurryFGG.github.io>

站点域名由根目录的 `CNAME` 文件指定为 `furryfgg.com`。发布后还需要在域名服务商处配置 GitHub Pages 所需 DNS 记录，并在仓库 Pages 设置中启用 HTTPS。
