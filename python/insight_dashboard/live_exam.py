from __future__ import annotations

from datetime import date
from typing import Any

from .exam import validate_question
from .live_common import record_base, seal
from .models import Question


def _templates(date_value: str) -> list[dict[str, Any]]:
    parsed_date = date.fromisoformat(date_value)
    variant = parsed_date.toordinal() % 4
    day = parsed_date.day
    total = 60 + (day % 7) * 5
    average = total // 5
    verbal_fill = [
        {
            "stem": "推进数字政府建设，既要打通数据壁垒，也要防止技术应用脱离群众需求。填入横线处最恰当的是：数字化转型应当____。",
            "options": {
                "A": "唯技术投入是从",
                "B": "以公共价值和实际需求为导向",
                "C": "取消全部线下服务",
                "D": "追求平台数量最大化",
            },
            "answer": "B",
            "explanation": "前文同时强调数据协同和群众需求，只有 B 准确概括二者。",
            "method": "抓住‘既要……也要……’后的共同目标。",
            "trap": "把数字化等同于单纯技术堆叠",
        },
        {
            "stem": "释放数据要素价值，既要让数据在合规前提下流动起来，也要让数据真正进入生产和治理场景。填入横线处最恰当的是：数据开发利用要____。",
            "options": {
                "A": "只重数量、不问质量",
                "B": "兼顾规范流通与场景应用",
                "C": "完全排斥市场主体参与",
                "D": "以重复建设扩大规模",
            },
            "answer": "B",
            "explanation": "文段强调合规流动与实际应用两个方面，B 完整对应。",
            "method": "把‘流动’和‘应用’两个关键词同时纳入答案。",
            "trap": "只概括其中一个方面",
        },
        {
            "stem": "基层治理既要及时回应群众诉求，也要通过制度化流程避免同类问题反复发生。填入横线处最恰当的是：治理创新应当____。",
            "options": {
                "A": "重应急处置、轻制度建设",
                "B": "把解决个案与完善机制结合起来",
                "C": "把所有问题交由技术平台处理",
                "D": "减少群众表达渠道",
            },
            "answer": "B",
            "explanation": "个案回应和制度化防复发分别对应治标与治本，B 兼顾两者。",
            "method": "看到‘也要’就寻找能同时覆盖前后要求的选项。",
            "trap": "把及时处置与长效治理割裂",
        },
        {
            "stem": "发展乡村数字产业，既不能照搬城市模式，也不能只建平台不管运营。填入横线处最恰当的是：项目建设应当____。",
            "options": {
                "A": "追求设备配置最高",
                "B": "因地制宜并重视长期运营",
                "C": "取消农户线下参与",
                "D": "以平台数量评价成效",
            },
            "answer": "B",
            "explanation": "不照搬要求因地制宜，不只建设要求关注运营，B 准确概括。",
            "method": "将两个否定句分别转成正面要求。",
            "trap": "把建设投入误作项目成效",
        },
    ][variant]
    necessary = [
        (
            "某项政策只有同时完成数据标准统一和部门职责确认，才能进入联调。现已进入联调。由此一定可以推出：",
            "数据标准统一",
            "部门职责确认",
            "进入联调",
        ),
        (
            "某政务应用只有同时通过个人信息保护评估和数据授权审查，才能正式上线。现该应用已正式上线。由此一定可以推出：",
            "个人信息保护评估",
            "数据授权审查",
            "正式上线",
        ),
        (
            "某制造项目只有同时通过环境影响评价和节能审查，才能开工建设。现该项目已经开工。由此一定可以推出：",
            "环境影响评价",
            "节能审查",
            "开工建设",
        ),
        (
            "某基层试点只有同时完成风险评估和人员培训，才能扩大实施范围。现试点已扩大实施范围。由此一定可以推出：",
            "风险评估",
            "人员培训",
            "扩大实施范围",
        ),
    ][variant]
    percent_variants = [
        ("某产业数字化投入", 160, 200, "增幅"),
        ("某事项平均办理时间", 12, 9, "降幅"),
        ("某园区高新技术企业数量", 250, 300, "增幅"),
        ("某项目单位能耗", 80, 68, "降幅"),
    ]
    subject, before, after, change_name = percent_variants[variant]
    percent = abs(after - before) / before * 100
    percent_text = f"{percent:g}%"
    percent_options = [max(1, percent - 5), percent, percent + 5, percent + 10]
    common = [
        {
            "stem": "下列做法中，最能体现基层治理中的全过程人民参与的是：",
            "options": {
                "A": "方案确定后仅发布结果",
                "B": "由单一部门内部决定全部事项",
                "C": "议题征集、协商论证、结果反馈和效果评估形成闭环",
                "D": "以网络投票代替所有法定程序",
            },
            "answer": "C",
            "explanation": "全过程参与强调从议题形成到实施评估的持续参与，同时不能取代法定程序。",
            "method": "识别征集、协商、反馈、评估四个连续环节。",
            "trap": "把一次性表达等同于全过程参与",
        },
        {
            "stem": "下列做法中，最有利于增强乡村产业内生发展能力的是：",
            "options": {
                "A": "长期依赖一次性补贴",
                "B": "只建设展示项目",
                "C": "培育本地人才并完善利益联结机制",
                "D": "照搬其他地区产业模式",
            },
            "answer": "C",
            "explanation": "内生能力来自本地人才、组织和可持续利益机制，而不是短期外部投入。",
            "method": "抓住‘内生’对应本地能力和长效机制。",
            "trap": "把外部输血当成持续造血",
        },
        {
            "stem": "下列营商环境改革措施中，最能体现规则公平和预期稳定的是：",
            "options": {
                "A": "对不同所有制企业设置不同准入条件",
                "B": "临时改变审批标准且不公开",
                "C": "公开统一标准并保持政策连续性",
                "D": "以运动式检查代替日常监管",
            },
            "answer": "C",
            "explanation": "统一、公开、连续的规则能够减少不确定性并保障公平竞争。",
            "method": "从公平、公开、稳定三个关键词筛选。",
            "trap": "把短期便利误作制度化营商环境",
        },
        {
            "stem": "下列做法中，最符合绿色发展理念的是：",
            "options": {
                "A": "先污染后治理",
                "B": "只追求短期产量",
                "C": "把资源节约和污染防治纳入生产全过程",
                "D": "以停止发展代替绿色转型",
            },
            "answer": "C",
            "explanation": "绿色发展强调全过程节约资源、减少污染，并非不要发展。",
            "method": "识别‘全过程’和‘发展与保护统一’。",
            "trap": "把绿色发展理解为停止生产",
        },
    ][variant]
    implication = [
        (
            "如果企业数字化投入有效，则生产效率提高或服务质量改善。现观察到生产效率未提高且服务质量未改善，可以推出：",
            "数字化投入",
            "企业没有使用数字技术",
            "服务质量一定下降",
        ),
        (
            "如果数据治理措施有效，则重复填报减少或数据准确率提高。现观察到重复填报未减少且数据准确率未提高，可以推出：",
            "数据治理措施",
            "部门没有采集数据",
            "数据准确率一定下降",
        ),
        (
            "如果绿色改造达到预期，则单位能耗下降或污染排放减少。现观察到单位能耗未下降且污染排放未减少，可以推出：",
            "绿色改造",
            "企业没有购置设备",
            "污染排放一定增加",
        ),
        (
            "如果就业培训产生所定义的效果，则就业率提高或岗位稳定性改善。现观察到就业率未提高且岗位稳定性未改善，可以推出：",
            "就业培训",
            "培训对象没有参加学习",
            "岗位数量一定减少",
        ),
    ][variant]
    main_idea = [
        (
            "产业升级不是简单增加设备，而是要让技术、人才、制度和市场彼此衔接。该句主要强调：",
            "产业升级需要多要素协同",
            "设备投资应全部停止",
            "人才比市场更重要",
            "制度可以代替技术",
        ),
        (
            "数字政府不能只把线下流程搬到网上，还要围绕群众需求重塑事项、材料和部门协同。该句主要强调：",
            "数字政府建设要以需求推动流程再造",
            "所有线下服务都应取消",
            "平台数量决定服务水平",
            "技术采购可以代替部门协同",
        ),
        (
            "乡村产业发展既需要技术和资金，也需要懂经营的人才、稳定的销售渠道和合理的利益联结。该句主要强调：",
            "乡村产业需要多要素形成长效机制",
            "资金投入可以解决全部问题",
            "销售渠道比人才更重要",
            "技术能够代替经营管理",
        ),
        (
            "促进青年就业不能只增加招聘信息，还要推动专业培养、实训内容和岗位标准有效衔接。该句主要强调：",
            "就业服务要加强人才培养与岗位需求匹配",
            "招聘信息越多就业一定越好",
            "实训可以代替专业学习",
            "岗位标准应完全由学校决定",
        ),
    ][variant]
    weighted_variants = [
        ((20, 30, 50), (90, 80, 70)),
        ((30, 30, 40), (80, 90, 75)),
        ((25, 25, 50), (88, 76, 82)),
        ((20, 40, 40), (75, 85, 90)),
    ]
    weights, scores = weighted_variants[variant]
    weighted = round(sum(weight * score for weight, score in zip(weights, scores, strict=True)) / 100)
    return [
        {
            "question_type": "言语理解",
            "difficulty": "基础",
            "stem": verbal_fill["stem"],
            "options": verbal_fill["options"],
            "correct_answer": verbal_fill["answer"],
            "explanation": verbal_fill["explanation"],
            "fastest_method": verbal_fill["method"],
            "traps": [verbal_fill["trap"]],
            "suggested_seconds": 60,
        },
        {
            "question_type": "判断推理",
            "difficulty": "中等",
            "stem": necessary[0],
            "options": {
                "A": f"只完成了{necessary[1]}",
                "B": f"只完成了{necessary[2]}",
                "C": "两项前置条件均已完成",
                "D": f"{necessary[3]}一定成功",
            },
            "correct_answer": "C",
            "explanation": f"‘只有 A 且 B，才 C’表示 C→A 且 B；已{necessary[3]}可推出两项前置条件均完成。",
            "fastest_method": f"把‘只有……才……’写成：{necessary[3]}→两项条件。",
            "traps": ["把必要条件方向写反"],
            "suggested_seconds": 70,
        },
        {
            "question_type": "数量关系",
            "difficulty": "中等",
            "stem": f"某学习小组 5 天共完成 {total} 道题，若每天完成题数相同，则平均每天完成多少道？",
            "options": {
                "A": str(average - 2),
                "B": str(average - 1),
                "C": str(average),
                "D": str(average + 1),
            },
            "correct_answer": "C",
            "explanation": f"{total}÷5={average}。",
            "fastest_method": "总量直接除以天数。",
            "traps": ["把总量与日均量混淆"],
            "suggested_seconds": 50,
        },
        {
            "question_type": "资料分析",
            "difficulty": "基础",
            "stem": f"{subject}由 {before} 变为 {after}，{change_name}为：",
            "options": {
                "A": f"{percent_options[0]:g}%",
                "B": percent_text,
                "C": f"{percent_options[2]:g}%",
                "D": f"{percent_options[3]:g}%",
            },
            "correct_answer": "B",
            "explanation": f"{change_name}=|{after}-{before}|÷{before}={percent_text}，分母为基期值。",
            "fastest_method": "先求变化量，再除以变化前的基期值。",
            "traps": ["错用报告期数值作分母"],
            "suggested_seconds": 70,
        },
        {
            "question_type": "常识判断",
            "difficulty": "中等",
            "stem": common["stem"],
            "options": common["options"],
            "correct_answer": common["answer"],
            "explanation": common["explanation"],
            "fastest_method": common["method"],
            "traps": [common["trap"]],
            "suggested_seconds": 60,
        },
        {
            "question_type": "判断推理",
            "difficulty": "进阶",
            "stem": implication[0],
            "options": {
                "A": f"{implication[1]}一定很多",
                "B": f"{implication[1]}未产生题干所定义的有效结果",
                "C": implication[2],
                "D": implication[3],
            },
            "correct_answer": "B",
            "explanation": "前件有效可推出两个结果至少一个成立；两个结果均被否定，可通过逆否命题否定‘有效’。",
            "fastest_method": "同时否定‘或’的两个分支，再用逆否命题。",
            "traps": ["把效果不足偷换成完全没有投入或行动"],
            "suggested_seconds": 80,
        },
        {
            "question_type": "言语理解",
            "difficulty": "中等",
            "stem": main_idea[0],
            "options": {"A": main_idea[2], "B": main_idea[1], "C": main_idea[3], "D": main_idea[4]},
            "correct_answer": "B",
            "explanation": "文段通过转折或递进指出，解决问题不能依靠单一投入，而要形成需求、要素和流程之间的协同。",
            "fastest_method": "定位转折或递进之后的总括关系。",
            "traps": ["把并列要素误读为单一要素优先"],
            "suggested_seconds": 55,
        },
        {
            "question_type": "数量关系",
            "difficulty": "中等",
            "stem": f"某项目三个指标权重分别为 {weights[0]}%、{weights[1]}%、{weights[2]}%，得分分别为 {scores[0]}、{scores[1]}、{scores[2]}，综合得分为：",
            "options": {
                "A": str(weighted - 2),
                "B": str(weighted - 1),
                "C": str(weighted),
                "D": str(weighted + 1),
            },
            "correct_answer": "C",
            "explanation": f"{scores[0]}×{weights[0]}%+{scores[1]}×{weights[1]}%+{scores[2]}×{weights[2]}%={weighted}。",
            "fastest_method": "各项分数乘权重后相加。",
            "traps": ["直接计算算术平均数"],
            "suggested_seconds": 80,
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
                {
                    "title": "数字政府中的流程再造",
                    "event_summary": "原创训练议题：从群众办事堵点反推跨部门流程优化。",
                    "policy_background": "围绕便民、高效、安全和协同建立分析框架。",
                    "theme": "数字政府",
                    "arguments": ["技术应用要服务公共价值", "数据共享与责任边界应同步明确"],
                    "case": "假设案例，不作为现实事实引用。",
                    "suitable_questions": ["概括题", "对策题"],
                },
                {
                    "title": "青年就业与产业需求衔接",
                    "event_summary": "原创训练议题：分析专业能力、实训内容和岗位标准之间的错配。",
                    "policy_background": "坚持就业优先，提升人才培养与产业发展的适配度。",
                    "theme": "青年就业",
                    "arguments": ["完善从培养到就业的服务链", "用岗位标准校准实训内容"],
                    "case": "假设案例，不作为现实事实引用。",
                    "suitable_questions": ["分析题", "综合题"],
                },
                {
                    "title": "江西制造业数字化转型",
                    "event_summary": "原创训练议题：讨论中小企业转型成本、服务供给与风险治理。",
                    "policy_background": "推动数字经济与实体经济深度融合。",
                    "theme": "江西发展",
                    "arguments": ["降低中小企业转型门槛", "以可复制场景带动能力沉淀"],
                    "case": "假设案例，不作为现实事实引用。",
                    "suitable_questions": ["对策题", "公文写作"],
                },
            ],
            "golden_sentences": [
                {
                    "type": "系统原创总结句",
                    "text": "数字化的成色，不只看平台建了多少，更要看群众少跑了多少、基层减负了多少。",
                },
                {"type": "政策规范表达", "text": "坚持需求牵引、场景驱动、规范发展和安全可控相统一。"},
                {
                    "type": "系统原创总结句",
                    "text": "产业升级既要有技术向上的高度，也要有就业稳定和公共价值的温度。",
                },
            ],
            "standard_expressions": [
                {
                    "plain": "办事来回跑",
                    "formal": "跨部门业务协同和材料共享仍有堵点",
                    "scenario": "数字政府、营商环境",
                    "example": "围绕高频事项推进材料复用和流程再造。",
                },
                {
                    "plain": "数据对不上",
                    "formal": "数据标准、更新频率与责任边界尚未统一",
                    "scenario": "数据要素、基层治理",
                    "example": "建立统一目录、质量规则和问题闭环。",
                },
                {
                    "plain": "招工求职两头难",
                    "formal": "人才供给与产业需求存在结构性错配",
                    "scenario": "青年就业、先进制造",
                    "example": "推动课程、实训和岗位标准有效衔接。",
                },
            ],
            "case_material": {
                "name": "南昌便民服务协同（原创情境）",
                "time_place": "假设情境，江西南昌",
                "practice": "以高频事项为切口统一材料目录、协同职责和反馈渠道。",
                "problem": "重复提交、系统分散、特殊群体服务不足。",
                "result": "不设置虚构成效数字，重点训练证据边界。",
                "lesson": "流程、数据、责任和反馈需要同步再造。",
                "themes": ["数字政府", "营商环境", "江西发展"],
                "limitation": "完全原创的假设材料，不得当作现实案例或政策成效引用。",
                "source": original_source,
            },
            "micro_practice": {
                "type": "对策题",
                "material": "某地多个政务平台功能重复，群众仍需反复提交材料；基层人员要在不同系统重复录入。部分老年人不会使用智能终端，线下帮办力量不足。",
                "requirement": "请概括问题并提出有针对性的改进建议。",
                "word_limit": 300,
                "reference_answer": "问题在于平台分散、数据标准不一、线上线下流程割裂及特殊群体服务不足。应统一入口和材料目录，明确数据共享责任，推动后台互联与业务流程再造；保留必要窗口和帮办服务；建立运行监测、群众反馈和定期评估机制，及时纠偏。",
                "scoring_points": ["平台整合", "数据共享", "流程再造", "线下兜底", "反馈评估"],
                "common_mistakes": ["只提增加技术投入", "对策与问题不对应", "忽略特殊群体"],
                "strong_expressions": ["推动数据通、业务通、服务通", "坚持线上提效与线下兜底并重"],
            },
            "weekly_essay": None,
            "is_demo": False,
        }
    )
    seal(shenlun)
    exam = record_base(f"exam-{date_value}", date_value, ["system-original"])
    exam.update({"questions": questions, "shenlun": shenlun, "is_demo": False})
    return seal(exam)
