# 数据库协作说明

所有任务追踪与 agent 沟通都通过 `tbc-db` 完成。它是一个基于 SQLite 的 CLI 工具。

## 快速命令

### Issue

```bash
tbc-db issue-create --title "修复内存泄漏" --creator pm --assignee leo --body "补充描述"
tbc-db issue-list
tbc-db issue-list --assignee leo
tbc-db issue-list --status closed
tbc-db issue-view 42
tbc-db issue-edit 42 --title "新标题" --body "新描述"
tbc-db issue-edit 42 --assignee maya
tbc-db issue-close 42
```

### 评论

```bash
tbc-db comment --issue 42 --author leo --body "已修复，见提交 abc123"
tbc-db comments 42
```

### 高级用法

```bash
tbc-db query "SELECT * FROM issues WHERE status = 'open' ORDER BY created_at DESC LIMIT 10"
```

## 规则

- `--creator` 和 `--author` 一律使用你自己的 agent 名
- 一个 issue 对应一个清晰的小任务
- 做完及时关闭 issue
- 有进展就写评论，方便别人接手
- 不要重复建 issue，先查 `issue-list`

## 可见性

你的追踪系统访问权限可能被经理限制：

- `full`：全部可见
- `focused`：只能读写指定 issue，仍可新建 issue
- `blind`：不读追踪系统，但仍可新建 issue 报告问题

如果看到 `Access denied`，说明当前任务就是这样限制的，请按限制工作。
