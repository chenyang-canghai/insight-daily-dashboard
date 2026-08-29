# 数据契约

TypeScript 契约位于 `src/types/content.ts`，Pydantic 契约位于 `python/insight_dashboard/models.py`。Schema 版本从 `1.0.0` 开始；破坏性变更必须升级主版本并提供迁移脚本。

所有顶层记录包含 `schema_version`、`id`、`date`、`generated_at`、`timezone`、`source_ids`、`content_hash`、`generation_status` 和 `validation_errors`。

- `NewsItem`：标题、类别、地区、时间、来源、摘要、重要性、可靠性、事实/推断、引用和关联。
- `DeepDive`：背景、时间线、利益相关方、机制、影响链、时间维度、未知信息、置信度和申论转化。
- `MarketDaily`：交易日状态、6 个指数、广度、成交、情绪依据、行业、研究标的、来源与质量。
- `Question`：授权类型、考试信息、题型、题干、选项、唯一答案、解析、最快方法、陷阱和建议时间。
- `ShenlunDaily`：时政主题、金句类型、规范表达、案例卡、微练习和周日大作文。

浏览器私有契约位于 `src/types/user-data.ts`，当前导出版本 `1.0.0`。
