# TheBotGameCompany

面向游戏项目协作场景改造的多项目 AI 编排器。

这个仓库基于原版 TheBotCompany 继续演进，但目标不再只是通用的软件开发自动化，而是更贴近游戏团队的制作链路：先由执行制作人统一收口目标，再由 PM 组织执行团队落地，接着由 QA 负责人验证里程碑，最后由最终验收做整项目出厂把关。

## 原版项目

- 原项目地址：<https://github.com/syifan/thebotcompany>
- 原版 README：<https://github.com/syifan/thebotcompany/blob/main/README.md>

如果你想了解原版的通用能力、默认工作流和上游文档，可以直接阅读原版 README。

## 我们的改进

- 把原来的 Athena / Ares / Apollo / Themis 经理体系，改成更符合游戏团队习惯的 `producer / pm / qa_lead / final_review` 四阶段岗位。
- 把管理规则和提示词整体改成中文，强调制作流程、验收口径、模块分工和角色边界。
- 强化“策划也是正式岗位”的设计，不再只把工作理解成程序实现，支持策划、主策、主程、主美、QA 等更贴近实际项目的组织方式。
- 增加安全并行调度能力，允许策划 / 美术 / QA / 研究类角色并行推进，程序和主程相关任务仍保持串行，降低多人改代码时的冲突风险。
- 加入最终验收阶段，不只看某个里程碑是否声称完成，而是独立检查整项目是否真的达到可交付状态。
- 增强自定义 provider 能力，补充自定义 OpenAI 兼容接口选择与自定义响应处理逻辑。
- 增加项目级 MCP 支持，可按项目配置 MCP 服务并让 agent 调用外部工具，也支持从本机常见全局配置一键导入。
- 补充“同名 agent 锁定”规则：已有 worker 的角色和模型不会被 PM 后续自动覆盖，避免上下文和工作区漂移。
- 扩展 custom credential 结构，一个凭据下可以维护完整模型目录，而不再只靠少数几个 tier 槽位。
- 把 chat 从“直接和模型对话”改成“和指定 agent 对话”，让对话真正继承岗位技能和上下文。
- 补强 Windows 本地开发体验，补充更顺手的启动脚本和执行兼容处理。
- 监控面板整体改成更偏游戏公司内部工具的视觉语言，并增加经典/工位两种办公室视图。

## 设计思路

### 1. 用游戏项目结构替代通用经理名字

上游默认的 manager 命名更偏抽象。这个 fork 改成了更直接的职责结构：

- `producer`：负责目标理解、范围控制、里程碑定义、路线图调整。
- `pm`：负责把当前里程碑拆成可执行任务，补人、写技能、派工、收口。
- `qa_lead`：负责验证里程碑是否真的达标，组织交叉检查。
- `final_review`：只在项目宣称整体完成时启动，独立判断能否算真正完工。

这样做的目的，是让 agent 的组织方式更贴近真实游戏团队，而不是让所有管理动作都堆在一个抽象 manager 身上。

### 2. 把岗位拆分得更贴近真实团队

这个 fork 不希望所有任务都直接落到“程序实现”上，而是尽量先按真实团队岗位拆开。

- `producer` 负责目标、优先级和阶段收口。
- `pm` 负责把目标拆成可以执行的任务，并补齐所需角色。
- 具体模块再按需要分给策划、程序、美术、QA 等岗位处理。

这样做的目的是让任务分发、问题回流和阶段验收都更清楚，不会把所有问题都堆到一个抽象 manager 或单一执行角色上。

### 3. 加入部分并行能力来加速工作

这个 fork 在 schedule 里加入了 `_parallel`，用来让一部分低冲突工作并行推进，加快整体节奏。

- 适合并行：策划、美术、QA、分析、研究、审校等低代码冲突角色。
- 不适合并行：程序、主程、PM、执行制作人、最终验收等需要强收口和顺序控制的角色。

核心思路是：能并行的前置工作和验证工作尽量并行，能明显提升推进速度；容易互相覆盖、需要统一决策的工作仍然保持串行。

### 4. 里程碑通过不等于项目完成

上游已经有阶段流转能力，这个 fork 进一步强调两层验收：

- `qa_lead` 验证当前里程碑是否通过。
- `final_review` 验证整个项目是否真的可以交付。

这样可以减少“某轮功能看起来做完了，但整个项目还有明显缺口”的情况。

## 核心能力

- 多项目编排：一个 orchestrator 管多个仓库。
- 多角色协作：支持执行制作人、PM、策划、程序、美术、QA 等岗位协同。
- 自定义技能体系：可按项目生成和维护 worker 技能文件。
- 里程碑流转：规划 -> 实现 -> 验证 -> 最终验收。
- 自定义 provider：支持 OpenAI / Anthropic 兼容接口扩展。
- 模型目录：支持一个凭据下维护多模型列表，并附带 label / tags 供 PM 和用户选型。
- MCP 工具接入：支持项目级 MCP server 配置、工具发现和调用，也支持从 Claude/Kiro/OpenCode/Cursor 等本机配置一键导入。
- Agent 锁定：同名 worker 创建后，角色和模型不会被后续自动改写，只有用户手动设置才会更新。
- Agent 对话：chat 面板按指定 agent 建立会话，而不是直接对某个裸模型发问。
- 可见性控制：支持 `full` / `focused` / `blind` 三种任务视野。
- 监控面板：查看项目状态、agent 报告、issue、成本和调度信息，并提供经典/工位双模式席位图。
- 多 key 池：支持 provider 级别的 key 管理与 fallback。

## 快速开始

### 环境要求

- Node.js 20+
- GitHub CLI `gh`
- 至少一个可用的大模型 provider 凭据

### 克隆项目

```bash
git clone https://github.com/Lynkzhang/thebotgamecompany.git TheBotGameCompany
cd TheBotGameCompany
```

### 安装依赖

```bash
npm install
cd monitor && npm install && cd ..
```

### 本地启动

Windows 下可以直接使用仓库内脚本：

```powershell
./start.ps1
```

或：

```bat
start.bat
```

也可以直接运行：

```bash
node src/server.js
```

如果你需要前后端联调开发：

```bash
tbc dev
```

## 启动脚本说明

- `start.ps1`：PowerShell 启动脚本。
- `start.bat`：Windows 批处理启动脚本。
- `start-server.ps1`：直接启动服务端的 PowerShell 脚本。

这些脚本默认会使用仓库目录下的 `.thebotcompany-demo` 作为 `TBC_HOME`，如果你已经手动设置了 `TBC_HOME`，脚本会优先使用你的环境变量。

## 配置说明

### 常用环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `TBC_PASSWORD` | 首次运行生成 | Dashboard 写操作密码 |
| `TBC_PORT` | `3100` | 服务端口 |
| `TBC_HOME` | `~/.thebotcompany` | 数据目录 |
| `TBC_SERVE_STATIC` | `true` | 是否托管编译后的 monitor 静态文件 |
| `TBC_ALLOW_CUSTOM_PROVIDER` | `false` | 是否启用自定义 provider |

### Provider

当前支持：

- Anthropic
- OpenAI
- Google / Gemini
- GitHub Copilot
- Azure OpenAI
- Amazon Bedrock
- Groq
- Mistral
- OpenRouter
- xAI
- MiniMax
- Hugging Face
- Kimi Coding
- Cerebras
- 自定义 OpenAI / Anthropic 兼容接口

### MCP

项目支持按项目配置 MCP 服务，agent 可以在运行中：

- 查看当前项目已启用的 MCP 服务
- 列出 MCP 服务暴露的工具
- 按参数调用 MCP 工具完成外部查询或操作

MCP 服务可以直接在项目设置面板中维护。

此外，系统还支持从本机常见全局配置来源一键发现并导入 MCP，例如：

- Claude 全局配置
- Claude 插件 `.mcp.json`
- Kiro MCP 配置
- OpenCode MCP 配置
- Cursor 插件 MCP 配置

对于 `stdio` 类型的本地 MCP，也支持直接导入并运行。

## 模型目录

这个 fork 不再把“一个凭据只能配少数几个 tier 模型”当成唯一方案。

- 一个 custom credential 下可以维护完整模型目录
- 每个模型支持：`id`、`label`、`tags`
- PM 会优先根据注入的模型目录和 tags 分配模型
- 项目设置和 agent 设置也会基于同一份模型目录选模型

这让一个 provider / 凭据下挂十几个模型成为可维护的正式配置，而不是临时备注。

## PM 使用思路

这个 fork 里，PM 不是单纯“把任务发出去”的调度器，而是项目执行期最核心的编排岗位。

PM 的推荐使用方式是：

1. 先看当前里程碑、已有 issue、已有 agent 报告，再决定这一轮最该推进什么。
2. 如果现有岗位足够，就优先复用已有 agent，不要为了同一类工作反复新建同名岗位。
3. 如果确实需要新岗位，先明确它是策划、程序、美术、QA 还是 lead，再给它补清晰技能说明。
4. 选模型时，优先看系统注入的“当前实例可用模型目录”，按 `label` 和 `tags` 选，不要只按 provider 名称拍脑袋。
5. 如果项目固定了某个 key，优先从该 key 的模型目录里分配；只有允许回退时，才考虑其他 key。
6. 如果同名 worker 已经存在，PM 只能继续派任务或补说明，不能自动改它的角色和模型。

一个更稳的经验是：

- 规划、长文分析、路线判断：优先给 producer / PM / 主策分配高质量、长上下文模型。
- 代码实现、patch、review：优先给程序和主程分配代码能力强的模型。
- 视觉理解、素材判断、图像生成：优先给美术或视觉岗位分配多模态模型。
- 回归、检查、清单验证：优先给 QA 分配更轻量、更快的模型。

也就是说，PM 在这里不是“统一给所有人一个默认模型”，而是根据岗位和任务，把当前实例真实可用的模型合理分配给不同 agent。

## Agent 锁定

为避免上下文和工作区漂移，已有 worker 会被视为稳定岗位：

- 同名 worker 不会被 PM 后续自动改角色
- 同名 worker 不会被 PM 后续自动改模型
- 只有用户手动通过设置面板修改时，角色/模型才会变化

这套约束特别适合长期迭代的项目，避免“同一个人名今天是程序，明天变策划”的混乱情况。

## 监控面板

监控面板除了基础状态和日志外，还补了更偏游戏团队氛围的可视化：

- 更柔和的游戏公司内部工具风格 UI
- `Managers / Workers` 办公区席位图
- `经典模式` 和 `工位模式` 两种视图切换
- 工位模式下的活跃席位高亮显示

## 安全说明

自定义 provider 默认关闭，因为它本质上允许服务端转发请求到用户填写的远端地址。

仓库里已经做了几层基础保护：

- 拒绝本地回环和常见内网 IP。
- 限制只允许 `http://` 和 `https://`。
- 自定义 provider 的新增和编辑必须经过写权限认证。

如果你是在共享环境里部署，建议保持 `TBC_ALLOW_CUSTOM_PROVIDER=false`。

## 开发说明

```bash
# 后端
node src/server.js

# 前端监控面板
cd monitor && npm run dev

# 测试
npm test
```

## 许可证

[MIT](LICENSE)
