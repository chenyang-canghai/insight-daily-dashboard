from __future__ import annotations

from datetime import date
from typing import Any

from .exam import validate_question
from .live_common import record_base, seal
from .models import Question


def _templates(date_value: str) -> list[dict[str, Any]]:
    day = date.fromisoformat(date_value).day
    total = 40 + day % 6 * 5
    average = total // 5
    return [
        {
            "question_type": "言语理解", "difficulty": "基础",
            "stem": "推进数字政府建设，既要打通数据壁垒，也要防止技术应用脱离群众需求。填入横线处最恰当的是：数字化转型应当____。",
            "options": {"A": "唯技术投入是从", "B": "以公共价值和实际需求为导向", "C": "取消全部线下服务", "D": "追求平台数量最大化"},
            "correct_answer": "B", "explanation": "前文同时强调数据协同和群众需求，只有 B 准确概括二者。", "fastest_method": "抓住‘既要……也要……’后的共同目标。", "traps": ["把数字化等同于单纯技术堆叠"], "suggested_seconds": 60,
        },
        {
            "question_type": "判断推理", "difficulty": "中等",
            "stem": "某项政策只有同时完成数据标准统一和部门职责确认，才能进入联调。现已进入联调。由此一定可以推出：",
            "options": {"A": "只完成了数据标准统一", "B": "只完成了部门职责确认", "C": "两项前置条件均已完成", "D": "联调一定成功"},
            "correct_answer": "C", "explanation": "‘只有 A 且 B，才 C’表示 C 是 A 且 B 的充分条件；已进入联调可推出两项前置条件均完成。", "fastest_method": "把‘只有……才……’写成：联调→两项条件。", "traps": ["把必要条件方向写反"], "suggested_seconds": 70,
        },
        {
            "question_type": "数量关系", "difficulty": "中等",
            "stem": f"某学习小组 5 天共完成 {total} 道题，若每天完成题数相同，则平均每天完成多少道？",
            "options": {"A": str(average - 2), "B": str(average - 1), "C": str(average), "D": str(average + 1)},
            "correct_answer": "C", "explanation": f"{total}÷5={average}。", "fastest_method": "总量直接除以天数。", "traps": ["把总量与日均量混淆"], "suggested_seconds": 50,
        },
        {
            "question_type": "资料分析", "difficulty": "基础",
            "stem": "某事项平均办理时间由 12 个工作日降至 9 个工作日，降幅为：",
            "options": {"A": "20%", "B": "25%", "C": "30%", "D": "33.3%"},
            "correct_answer": "B", "explanation": "降幅=(12-9)÷12=25%，分母为改革前的基期值。", "fastest_method": "减少 3，占基期 12 的四分之一。", "traps": ["错用改革后的 9 作分母"], "suggested_seconds": 70,
        },
        {
            "question_type": "常识判断", "difficulty": "中等",
            "stem": "下列做法中，最能体现基层治理中的全过程人民参与的是：",
            "options": {"A": "方案确定后仅发布结果", "B": "由单一部门内部决定全部事项", "C": "议题征集、协商论证、结果反馈和效果评估形成闭环", "D": "以网络投票代替所有法定程序"},
            "correct_answer": "C", "explanation": "全过程参与强调从议题形成到实施评估的持续参与，同时不能取代法定程序。", "fastest_method": "识别征集、协商、反馈、评估四个连续环节。", "traps": ["把一次性表达等同于全过程参与"], "suggested_seconds": 60,
        },
        {
            "question_type": "判断推理", "difficulty": "进阶",
            "stem": "如果企业数字化投入有效，则生产效率提高或服务质量改善。现观察到生产效率未提高且服务质量未改善，可以推出：",
            "options": {"A": "数字化投入一定很多", "B": "数字化投入未产生所定义的有效结果", "C": "企业没有使用数字技术", "D": "服务质量一定下降"},
            "correct_answer": "B", "explanation": "由‘有效→效率提高或质量改善’及后件两个分支均否定，可否定前件中的‘有效’。", "fastest_method": "对‘或’的两个结果同时否定，再用逆否命题。", "traps": ["把效果不足偷换成完全没有投入"], "suggested_seconds": 80,
        },
        {
            "question_type": "言语理解", "difficulty": "中等",
            "stem": "产业升级不是简单增加设备，而是要让技术、人才、制度和市场彼此衔接。该句主要强调：",
            "options": {"A": "设备投资应全部停止", "B": "产业升级需要多要素协同", "C": "人才比市场更重要", "D": "制度可以代替技术"},
            "correct_answer": "B", "explanation": "‘不是……而是……’之后列举四类要素并强调衔接，主旨是协同。", "fastest_method": "定位转折后的总括关系。", "traps": ["把并列要素误读为单一要素优先"], "suggested_seconds": 55,
        },
        {
            "question_type": "数量关系", "difficulty": "中等",
            "stem": "某项目三个指标权重分别为 20%、30%、50%，得分分别为 90、80、70，综合得分为：",
            "options": {"A": "75", "B": "76", "C": "77", "D": "78"},
            "correct_answer": "C", "explanation": "90×20%+80×30%+70×50%=18+24+35=77。", "fastest_method": "各项分数乘权重后相加。", "traps": ["直接计算算术平均数"], "suggested_seconds": 80,
        },
    ]


def generate_exam(date_value: str) -> dict[str, Any]:
    questions: list[dict[str, Any]] = []
    for index, template in enumerate(_templates(date_value), 1):
        question = record_base(f"q-{date_value}-{index}", date_value)
        question.update(
            {
                "source_type": "original",
                "source_name": "知势原创能力训练",
                "year": date.fromisoformat(date_value).year,
                "region": "通用",
                "exam_type": "国考/江西省考能力训练",
                "material": None,
                "tags": [template["question_type"], "原创", "每日训练"],
                "is_demo": False,
                **template,
            }
        )
        seal(question)
        parsed = Question.model_validate(question)
        errors = validate_question(parsed)
        if errors:
            raise ValueError(f"question {index}: {'; '.join(errors)}")
        questions.append(question)

    original_source = {
        "source_id": "system-original",
        "source_name": "知势原创训练材料",
        "url": "https://github.com/chenyang-canghai/insight-daily-dashboard",
        "title": "原创、假设性申论训练材料说明",
        "published_at": None,
        "note": "下列案例均为假设情境，不代表现实地区或项目事实。",
    }
    shenlun = record_base(f"shenlun-{date_value}", date_value, ["system-original"])
    shenlun.update(
        {
            "current_affairs": [
                {"title": "数字政府中的流程再造", "event_summary": "原创训练议题：从群众办事堵点反推跨部门流程优化。", "policy_background": "围绕便民、高效、安全和协同建立分析框架。", "theme": "数字政府", "arguments": ["技术应用要服务公共价值", "数据共享与责任边界应同步明确"], "case": "假设案例，不作为现实事实引用。", "suitable_questions": ["概括题", "对策题"]},
                {"title": "青年就业与产业需求衔接", "event_summary": "原创训练议题：分析专业能力、实训内容和岗位标准之间的错配。", "policy_background": "坚持就业优先，提升人才培养与产业发展的适配度。", "theme": "青年就业", "arguments": ["完善从培养到就业的服务链", "用岗位标准校准实训内容"], "case": "假设案例，不作为现实事实引用。", "suitable_questions": ["分析题", "综合题"]},
                {"title": "江西制造业数字化转型", "event_summary": "原创训练议题：讨论中小企业转型成本、服务供给与风险治理。", "policy_background": "推动数字经济与实体经济深度融合。", "theme": "江西发展", "arguments": ["降低中小企业转型门槛", "以可复制场景带动能力沉淀"], "case": "假设案例，不作为现实事实引用。", "suitable_questions": ["对策题", "公文写作"]},
            ],
            "golden_sentences": [
                {"type": "系统原创总结句", "text": "数字化的成色，不只看平台建了多少，更要看群众少跑了多少、基层减负了多少。"},
                {"type": "政策规范表达", "text": "坚持需求牵引、场景驱动、规范发展和安全可控相统一。"},
                {"type": "系统原创总结句", "text": "产业升级既要有技术向上的高度，也要有就业稳定和公共价值的温度。"},
            ],
            "standard_expressions": [
                {"plain": "办事来回跑", "formal": "跨部门业务协同和材料共享仍有堵点", "scenario": "数字政府、营商环境", "example": "围绕高频事项推进材料复用和流程再造。"},
                {"plain": "数据对不上", "formal": "数据标准、更新频率与责任边界尚未统一", "scenario": "数据要素、基层治理", "example": "建立统一目录、质量规则和问题闭环。"},
                {"plain": "招工求职两头难", "formal": "人才供给与产业需求存在结构性错配", "scenario": "青年就业、先进制造", "example": "推动课程、实训和岗位标准有效衔接。"},
            ],
            "case_material": {"name": "南昌便民服务协同（原创情境）", "time_place": "假设情境，江西南昌", "practice": "以高频事项为切口统一材料目录、协同职责和反馈渠道。", "problem": "重复提交、系统分散、特殊群体服务不足。", "result": "不设置虚构成效数字，重点训练证据边界。", "lesson": "流程、数据、责任和反馈需要同步再造。", "themes": ["数字政府", "营商环境", "江西发展"], "limitation": "完全原创的假设材料，不得当作现实案例或政策成效引用。", "source": original_source},
            "micro_practice": {"type": "对策题", "material": "某地多个政务平台功能重复，群众仍需反复提交材料；基层人员要在不同系统重复录入。部分老年人不会使用智能终端，线下帮办力量不足。", "requirement": "请概括问题并提出有针对性的改进建议。", "word_limit": 300, "reference_answer": "问题在于平台分散、数据标准不一、线上线下流程割裂及特殊群体服务不足。应统一入口和材料目录，明确数据共享责任，推动后台互联与业务流程再造；保留必要窗口和帮办服务；建立运行监测、群众反馈和定期评估机制，及时纠偏。", "scoring_points": ["平台整合", "数据共享", "流程再造", "线下兜底", "反馈评估"], "common_mistakes": ["只提增加技术投入", "对策与问题不对应", "忽略特殊群体"], "strong_expressions": ["推动数据通、业务通、服务通", "坚持线上提效与线下兜底并重"]},
            "weekly_essay": None,
            "is_demo": False,
        }
    )
    seal(shenlun)
    exam = record_base(f"exam-{date_value}", date_value, ["system-original"])
    exam.update({"questions": questions, "shenlun": shenlun, "is_demo": False})
    return seal(exam)
