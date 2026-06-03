# Moni 部署与安装

## 部署到免费静态托管

构建产物在 `dist/`。任选其一：

### Vercel
1. `npm i -g vercel`
2. `npm run build`
3. `vercel --prod`（首次按提示登录、选项目）
4. 得到 HTTPS 地址，如 `https://moni-xxx.vercel.app`

### Netlify
1. `npm run build`
2. 拖 `dist/` 到 https://app.netlify.com/drop
3. 得到 HTTPS 地址

### GitHub Pages
1. `npm run build`
2. 把 `dist/` 推到 `gh-pages` 分支（或用 actions）
3. 仓库 Settings → Pages 选该分支
4. 注意子路径：若地址含子目录，`vite.config.js` 的 `base` 改为 `'/仓库名/'` 后重新构建

## 手机安装（加到主屏）

PWA 必须用 HTTPS 地址（上面托管地址自带）。

### iOS（Safari）
1. Safari 打开地址（必须 Safari，非微信/Chrome）
2. 底部「分享」→「添加到主屏幕」
3. 桌面出现 Moni 图标，点开全屏运行，不过期

### 安卓（Chrome）
1. Chrome 打开地址
2. 菜单 →「安装应用」/「添加到主屏幕」
3. 出现 Moni 图标

## 换机迁移
1. 旧机 → 我的 → 显示二维码（数据多会轮播多帧）
2. 新机 → 我的 → 扫码导入 → 持续对准旧机屏幕直到提示成功
3. 兜底：旧机导出备份文件，传给新机后导入

> 摄像头扫码需 HTTPS（托管地址满足）。本地调试用 localhost 也可。