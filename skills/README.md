# 现成 Skills / Existing skills

[中文首页](../README.md) · [English home](../README.en.md)

选择与现有账号、素材和交付目标相符的入口。这里核查固定版本的文档和源码，实际生成、安装和微信提交状态由使用者的环境决定。

## 直接请求 GIF / Native GIF requests

| 固定版本与安装入口 | 所需环境 | 输出与边界 |
| --- | --- | --- |
| [gpt-image-gif](https://github.com/vargHQ/skills/blob/72e8109188e3366ba8d365902a84d6b237dec1d7/gpt-image-gif/README.md) | Agent Skills、varg 账户及 API Key 或 MCP，转码用 FFmpeg | 单张循环 GIF，可转 WebP 或 MP4 |
| [gpt-image-sticker-pack](https://github.com/vargHQ/skills/blob/72e8109188e3366ba8d365902a84d6b237dec1d7/gpt-image-sticker-pack/README.md) | Agent Skills、varg 账户，尺寸适配用 FFmpeg | 逐张请求原生 GIF，再处理已有动图。投稿由作者完成 |
| [higgsfield-generate](https://github.com/higgsfield-ai/skills/blob/27000402070db19d958789d05b3b52b6f4718d7c/INSTALL.md) | Higgsfield CLI、账户和可用服务额度 | 固定版本提供 GIF 命令样例，具体模型和输入按原说明 |
| [Sogni Creative Agent](https://github.com/Sogni-AI/sogni-creative-agent-skill/blob/864b74113b96a4dd18dbd3eb0125ba3e299820c2/README.md) | Sogni 账户、相应的宿主环境和额度 | 经 Sogni 请求 GIF，官方微信物料另行准备 |
| [Frevana Flare 与 Sunburst](https://github.com/FinpeakInc/frevana-skills/blob/7952e54fe1ec45e571898ee77b83612054159bbd/README.md) | Bash、curl、Python 3 和 Frevana 令牌 | 两个独立 Skill，固定版 GIF 分支为文生。输出 JSON 和托管 GIF 链接 |

## 图集合成、收尾和投稿辅助 / Assembly, finishing and submission support

| 固定版本与安装入口 | 所需环境 | 输出与边界 |
| --- | --- | --- |
| [Levi 的 GIF 工厂前版](https://github.com/WoYun520/gif-factory/blob/a4559f8aa8bcdec352f98b621d7500c913da1b6b/README.md) | 支持生图的宿主、Python、Pillow 和字体，MP4 用 FFmpeg | 图集转 GIF、ZIP 与预览。固定版本以源文件为准 |
| [Vane 人像动图](https://github.com/VaneAi888/vane-portrait-gif-stickers/blob/d83ee786a4aa72d5229f88247d2da44855182360/README.md) | 生图助手、Python、Pillow 和字体，MP4 用 FFmpeg | 静态图层变换合成 GIF，附预览与打包 |
| [ray-sticker-shop](https://github.com/imraywang/ray-sticker-shop/tree/d274a8831b73a9f41504c66d330ca90119582119) | Python、Pillow，调用模型的模式另需凭据 | 图集切帧、专辑材料与文案。平台提交由作者完成 |
| [kim-sticker-pack](https://github.com/KimYx0207/Kim_Service/blob/aceed1895f61cc4681cabb41b1afe6911c9d8a58/skills/kim-sticker-pack/README.md) | Python、Pillow、fontTools 和字体 | 以已有连续动作帧为输入，完成 GIF 收尾 |
| [半格 wechat-sticker-pack](https://github.com/ban-ge/wechat-sticker-pack/tree/29656dae1d8024312a5f26bbbe3c8b8d1472613f) | 支持图像和动画工具的宿主 | 9 个聊天用循环 GIF 加一份动态总览，按宿主能力直接生成或组合关键帧 |
| [qtyasupo 微信工作室](https://github.com/qtyasupo/wechat-gif-sticker-studio/tree/c2b38fd73066a58845d2b730c84e6aa6af343774) | 生成阶段使用可生成 GIF 的网页端，后续按原仓运行检查 | 用户提供生成结果，Skill 检查并整理配套图、文案和 ZIP，作者案例为待审 |
| [DeaglePC 微信工作室](https://github.com/DeaglePC/wechat-sticker-studio/tree/6f03029b842eb667c456269bdf123c0e0be35f9f) | 生图宿主、Python 和 Pillow，上传另需浏览器及作者账号 | 从关键帧组装，整理并辅助上传。文档验证来自模拟表单 |

Compare the required account and input before installing a skill. The first group documents native GIF requests. The second group covers sprite assembly, finishing existing frames, or organizing submission materials. [旧版源码与许可说明](https://github.com/dongyu19920904/awesome-gif-stickers/blob/v0.3.3/docs/skills.md) · [微信提交指南](../guides/wechat.md#submit)
