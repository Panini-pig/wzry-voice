# 王者语音库 · 全英雄全皮肤台词

把《王者荣耀》全英雄、全皮肤的语音台词做成一个可以在手机浏览器里浏览、搜索、收藏、播放的静态站点。

## 线上地址

| 入口 | 说明 |
|---|---|
| **<https://wzry.panini-pigs.cn>** | 主站（Cloudflare Pages + 自定义域名） |
| <https://wzry-voice.pages.dev> | CF Pages 默认域名 |
| <https://panini-pig.github.io/wzry-voice/> | GitHub Pages 镜像 |
| `https://audio.wzry.panini-pigs.cn` | 音频（Cloudflare R2） |

- **134 位英雄 · 1,001 款皮肤 · 18,160 条台词**（其中 18,139 条可播放）
- 数据源：腾讯「荣耀萤火素材库」（iCreate）的官方素材接口
- 音频托管：Cloudflare R2（`audio.wzry.panini-pigs.cn`），约 1.3 GB
- 站点：Cloudflare Pages / GitHub Pages，纯静态，无后端

## 功能

| | |
|---|---|
| 桌面三栏 | ≥1200px 自动切换：左栏英雄导航 / 中栏内容 / 右栏海报与队列 |
| 浮动播放卡 | 桌面右下角常驻，不遮挡内容 |
| 英雄墙 | 按职业筛选，显示每位英雄的台词数量 |
| 英雄页 | 皮肤切换、全部/按皮肤播放、每条台词的分类与时长 |
| 播放器 | 连播、上一条/下一条、倍速、定时关闭、进度拖动 |
| 锁屏控制 | Media Session API，支持锁屏/通知栏/蓝牙耳机 |
| 搜索 | 英雄名、皮肤名、台词全文，边输边搜 |
| 收藏 | 本地保存（localStorage），可整组播放 |
| 海报 | 全屏查看、双指缩放、左右滑动切皮肤、模糊背景填充 |
| PWA | 可加到主屏，Service Worker 缓存壳与听过的语音 |

## 响应式断点

| 宽度 | 布局 |
|---|---|
| < 1200px | 手机版：单列 + 底部 Tab + 底部播放条 |
| ≥ 1200px | 桌面版：284px 左栏 + 自适应中栏 + 368px 右栏，右下角浮动播放卡 |

桌面组件在 `src/desktop/`，只通过断点切换，数据、路由、播放状态与手机版共用。

## 本地开发

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 产物在 dist/
npm run preview  # 预览构建结果
```

`npm run build` 会先把 `data/site/` 复制到 `public/data/`，再由 Vite 打包。

## 目录结构

```
data/site/           站点数据（已提交）
  heroes.json        134 位英雄 + 皮肤列表 + 海报地址
  voices/<id>.json   每位英雄的台词（懒加载）
  index.json         搜索索引（英雄/皮肤/台词）
data/raw/            iCreate 原始抓取结果（未提交，39MB）
data/audio_clean/    下载的 mp3，按英雄 tag 分目录（未提交）
scripts/normalize.mjs        原始数据 → 站点数据
scripts/restructure-audio.mjs 把音频整理成 <英雄tag>/<rowkey>.mp3
scripts/copy-data.mjs        构建前复制数据
scripts/shot.mjs             Playwright 手机端截图自测
```

## 数据是怎么来的

1. 登录 <https://pvp.icreate.qq.com/>，从 DevTools 里取一条 `/pvp/` 请求的 `authorization`（JWT，24 小时有效）
2. 调 `POST https://icreate.native.qq.com/pvp/hero/list` → 134 个英雄 tag
3. `POST /pvp/tag/list` → 皮肤标签树（每个英雄 tag 下的子标签就是皮肤）
4. 对每个英雄 `POST /pvp/material/list`（`tagId` + 分页）→ 素材列表，`comType === "16"` 即语音
5. 语音字段：`title` 是分类（移动/击杀/回城/相遇…），`summary` 是台词原文，`transcodingUrl` 是 mp3（**24 小时签名，过期即 403，必须下载自存**）
6. 下载 mp3 → `scripts/restructure-audio.mjs` 整理目录 → `scripts/normalize.mjs` 生成站点数据
7. `rclone copy data/audio_clean r2:wzry-voice/audio`

英雄头像与皮肤海报直接用官方公开 CDN：
`https://game.gtimg.cn/images/yxzj/img201606/heroimg/{ename}/{ename}.jpg`、
`.../skin/hero-info/{ename}/{ename}-bigskin-{n}.jpg`（无签名、带 `Access-Control-Allow-Origin: *`）

## 部署

站点已接入两条自动发布链路，**push 到 `main` 即自动上线**：

1. **Cloudflare Pages**（主站）：项目 `wzry-voice` 已 Connect 到本仓库，构建命令 `npm run build`，输出 `dist`，绑定 `wzry.panini-pigs.cn`。
2. **GitHub Pages**（镜像）：`.github/workflows/deploy.yml` 用 `actions/deploy-pages` 发布到 `panini-pig.github.io/wzry-voice/`。

手动发布（应急）：

```bash
npm run deploy     # 构建 + wrangler pages deploy
```

## 日常维护

- **新增英雄/皮肤**：重新抓一次 iCreate（需重新登录拿 JWT）→ `node scripts/normalize.mjs` → 把新增 mp3 传到 R2 → `git push`
- **音频新增上传**：`rclone copy data/audio_clean r2:wzry-voice/audio --transfers 24 --s3-no-check-bucket`
- **R2 缓存头**：上传时带 `Cache-Control: public,max-age=31536000,immutable`
- **iCreate 的音频链接只有 24 小时有效期**（去掉 `?sign=` 直接 403），所以必须自存，不能热链

## 版权

语音、海报、英雄形象版权归腾讯《王者荣耀》所有。本站为个人学习交流用途，非商用、不提供批量下载，素材来自官方开放的创作者素材库。如权利人认为不妥，请联系删除。
