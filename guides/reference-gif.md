# 参考图转原生 GIF / From a reference image to a native GIF

[中文首页](../README.md) · [English home](../README.en.md) · [微信适配 / WeChat preparation](wechat.md#prepare)

以下作者发布了可对照的输入和输出。原图、成品和原词从作者页面核对，媒体保持作者原址。

| 作者与案例 | 作者报告的输入与输出 | 原词位置 |
| --- | --- | --- |
| vargHQ 的 Pip 挥手跳跃 | 作者先确认一张角色静态图，再在编辑请求中传入这张图。发布的 GIF 为 768×768、9 帧、每帧 140 ms。作者也展示了同一角色的透明 LOL 和字幕失败样例。 | 固定版 Skill 的第 2 节有原图、输出和完整请求。 [作者记录](https://github.com/vargHQ/skills/blob/e20be4837e3d1a9de9b4598c1d16ee2dd49e776d/gpt-image-gif/SKILL.md#2-workflow-approve-a-still-first) |
| APIMODELS 的线稿小鸟 | 作者在自家服务上向 Flare 提供小鸟线稿，让它眨眼、跳动并出现爱心。报告输出为 960×720、6 帧、每帧 150 ms。 | 服务商第 3 项实测有原图和 GIF。作者的代码说明把示例 URL 写成占位地址，实际参考图见实测页。 [原图与效果](https://apimodels.app/blog/gpt-image-2-6-api-tested#test-3-from-line-art-to-an-animated-loop) · [作者请求示例](https://dev.to/super_lewis/animated-gifs-and-markup-guided-edits-with-the-gpt-image-26-api-real-timings-and-per-call-cost-2jmd#animate-an-image-you-already-have) |

用 OpenAI 原生 API 时，以官方图像编辑接口的字段和约束为准。上表参数来自作者所用服务。获得 GIF 后，先对照聊天添加和专辑主图的不同要求，再处理尺寸、字节和深色背景效果。 [OpenAI 原生 GIF](https://developers.openai.com/api/docs/guides/image-generation#generate-animated-gif-output) · [微信检查与适配](wechat.md#prepare)

## English

- **vargHQ, Pip wave and hop.** The creator provides the approved still, a 768 × 768 GIF with nine frames at 140 ms each, and the full request in section 2. The same workflow documents a transparent sticker and a failed caption. [Creator workflow](https://github.com/vargHQ/skills/blob/e20be4837e3d1a9de9b4598c1d16ee2dd49e776d/gpt-image-gif/SKILL.md#2-workflow-approve-a-still-first)
- **APIMODELS, animated bird line art.** The provider reports using Flare on its own service to create a 960 × 720, six-frame GIF at 150 ms per frame. The test page shows the actual input and output. The author's tutorial labels the input URL in its request example as a placeholder. [Input and result](https://apimodels.app/blog/gpt-image-2-6-api-tested#test-3-from-line-art-to-an-animated-loop) · [Author's request example](https://dev.to/super_lewis/animated-gifs-and-markup-guided-edits-with-the-gpt-image-26-api-real-timings-and-per-call-cost-2jmd#animate-an-image-you-already-have)

Both examples link to the creators' pages. Check the official Images API documentation for its own fields, then check dimensions and playback against the intended WeChat use. [OpenAI documentation](https://developers.openai.com/api/docs/guides/image-generation#generate-animated-gif-output) · [WeChat preparation](wechat.md#prepare)
