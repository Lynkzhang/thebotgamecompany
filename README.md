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
- 增加项目级 MCP 支持，可按项目配置 MCP 服务并让 agent 调用外部工具。
- 补强 Windows 本地开发体验，补充更顺手的启动脚本和执行兼容处理。
- 对外品牌改成 `TheBotGameCompany`，让这个 fork 更明确地表达自己的定位。

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
- MCP 工具接入：支持项目级 MCP server 配置、工具发现和调用。
- 可见性控制：支持 `full` / `focused` / `blind` 三种任务视野。
- 监控面板：查看项目状态、agent 报告、issue、成本和调度信息。
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
