import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dates = ["2026-08-27", "2026-08-28", "2026-08-29"];
const schemaVersion = "1.0.0";

const hash = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const generatedAt = (date, hour = "07:15:00") => `${date}T${hour}+08:00`;
const meta = (id, date, sourceIds = []) => ({
  schema_version: schemaVersion,
  id,
  date,
  generated_at: generatedAt(date),
  timezone: "Asia/Shanghai",
  source_ids: sourceIds,
  content_hash: "pending",
  generation_status: "demo",
  validation_errors: [],
});

const topics = [
  {
    category: "宏观经济",
    regions: ["全球", "中国"],
    title: "宏观政策如何通过预期与需求传导",
    sourceId: "demo-imf",
    sourceName: "国际货币基金组织（结构演示）",
    url: "https://www.imf.org/en/News",
    tags: ["宏观经济", "政策传导"],
    summary:
      "这是一条结构演示议题，用于展示如何把宏观政策拆成需求、预期、就业和市场反馈。它不对应某一篇实时新闻，也不引用具体经济数据；正式运行时必须由原始统计或政策文件替换。",
    why: "训练从政策工具到居民和企业行为的完整推理链，避免只记结论。",
  },
  {
    category: "人工智能",
    regions: ["中国", "全球"],
    title: "人工智能治理如何兼顾创新、安全与普惠",
    sourceId: "demo-cac",
    sourceName: "国家互联网信息办公室（结构演示）",
    url: "https://www.cac.gov.cn/",
    tags: ["人工智能", "平台治理", "安全"],
    summary:
      "本条用于演示人工智能治理分析框架：既关注技术扩散和产业效率，也审视数据、算法、就业和公共服务风险。内容为原创示例，不代表监管部门发布了新的政策文件。",
    why: "与数字经济研究、公务员申论和产业观察三条学习主线同时相关。",
  },
  {
    category: "半导体",
    regions: ["中国", "东亚"],
    title: "半导体产业链韧性应如何观察",
    sourceId: "demo-miit",
    sourceName: "工业和信息化部（结构演示）",
    url: "https://www.miit.gov.cn/",
    tags: ["半导体", "先进制造", "产业链"],
    summary:
      "本条用设备、材料、设计、制造、封测和下游需求六个环节演示产业链分析。所有企业与行情信息均被省略，正式内容必须使用公告、财报或主管部门材料核验。",
    why: "帮助区分长期能力建设、短期订单变化和市场情绪三种不同信号。",
  },
  {
    category: "数字经济",
    regions: ["中国"],
    title: "数据要素从资源到生产要素需要哪些制度条件",
    sourceId: "demo-ndrc",
    sourceName: "国家发展和改革委员会（结构演示）",
    url: "https://www.ndrc.gov.cn/",
    tags: ["数据要素", "数字经济", "制度建设"],
    summary:
      "这是一条制度分析示例，围绕确权授权、合规流通、收益分配、安全治理和公共数据开发展开。示例不声称存在新的政策变动，正式日报需引用具体文件条款。",
    why: "该主题既是数字经济专业核心问题，也是数字政府和营商环境常见申论方向。",
  },
  {
    category: "中国政策",
    regions: ["中国"],
    title: "政策落地为何需要目标、工具与反馈闭环",
    sourceId: "demo-gov",
    sourceName: "中国政府网（结构演示）",
    url: "https://www.gov.cn/zhengce/",
    tags: ["政策执行", "公共治理"],
    summary:
      "本条演示政策解读时应区分目标、执行主体、政策工具、资金来源、评价指标和纠偏机制。它不对应特定会议或文件，不能作为现实政策事实引用。",
    why: "把政策语言转成可观察指标，有助于申论论证和实际治理分析。",
  },
  {
    category: "江西发展",
    regions: ["江西", "南昌"],
    title: "南昌数字产业与公共服务如何形成协同",
    sourceId: "demo-nanchang",
    sourceName: "南昌市人民政府（结构演示）",
    url: "https://www.nc.gov.cn/",
    tags: ["江西发展", "南昌", "数字政府"],
    summary:
      "本条是本地化申论案例结构示例，围绕产业生态、人才服务、政务数据和中小企业数字化展开。没有使用真实项目名称、投资额或成效数字，正式内容必须逐项核验。",
    why: "直接服务江西省考、南昌求职与区域数字经济研究。",
  },
  {
    category: "国际时政",
    regions: ["欧洲", "全球"],
    title: "国际政策变化如何影响贸易与企业预期",
    sourceId: "demo-ecb",
    sourceName: "欧洲中央银行（结构演示）",
    url: "https://www.ecb.europa.eu/press/html/index.en.html",
    tags: ["国际时政", "贸易", "预期"],
    summary:
      "本条用于演示国际政策事件的传导分析，依次观察汇率、融资成本、贸易订单、产业链调整和风险偏好。示例不包含任何现实政策决定或市场报价。",
    why: "形成从国际事件到中国行业和普通就业者的多层影响意识。",
  },
  {
    category: "资本市场",
    regions: ["中国"],
    title: "资本市场信息质量为何比短期预测更重要",
    sourceId: "demo-csrc",
    sourceName: "中国证券监督管理委员会（结构演示）",
    url: "https://www.csrc.gov.cn/",
    tags: ["A股", "信息披露", "风险识别"],
    summary:
      "本条说明研究应优先核对公告、财务口径、数据日期与风险事项，而不是依赖传闻和价格预测。示例不评价任何真实证券，也不构成投资建议。",
    why: "建立以基本面、行业逻辑、信息质量和证伪条件为中心的研究习惯。",
  },
];

const baseQuestions = [
  [
    "言语理解",
    "选择最适合填入句中的词语：公共数据开发既要提高利用效率，也要守住安全____。",
    { A: "底线", B: "速度", C: "形式", D: "规模" },
    "A",
    "‘守住’通常与‘底线’搭配，且与安全治理语义一致。",
    "先看固定搭配‘守住底线’，再核对语境。",
    ["只看到‘效率’而误选速度"],
  ],
  [
    "判断推理",
    "所有通过校验的数据都可发布；有些采集数据未通过校验。由此一定能推出什么？",
    {
      A: "所有采集数据都不可发布",
      B: "有些采集数据不能据此确认可发布",
      C: "未通过校验的数据一定错误",
      D: "可发布数据都来自采集",
    },
    "B",
    "规则只给出通过校验是可发布的充分条件，未通过并不等于一定错误，但其发布资格不能由该规则确认。",
    "把充分条件写成：通过校验→可发布，不能逆推。",
    ["把充分条件误当必要条件"],
  ],
  [
    "数量关系",
    "某学习计划原定每天 8 题，连续 5 天共完成 50 题。平均每天比原计划多多少题？",
    { A: "1", B: "2", C: "3", D: "4" },
    "B",
    "实际平均为 50÷5=10 题，比 8 题多 2 题。",
    "总量除以天数，再与计划作差。",
    ["把总增量 10 题当成每天增量"],
  ],
  [
    "资料分析",
    "某服务事项办理时长由 10 个工作日降至 6 个工作日，降幅为多少？",
    { A: "30%", B: "40%", C: "50%", D: "60%" },
    "B",
    "降幅=(10-6)÷10=40%。基期是改革前的 10 个工作日。",
    "减少量 4 除以基期 10。",
    ["误用改革后的 6 作为分母"],
  ],
  [
    "常识判断",
    "下列哪项最能体现依法行政中的程序正当？",
    {
      A: "只追求办理速度",
      B: "重大决策履行公众参与和合法性审查",
      C: "以内部口头通知替代公开规则",
      D: "对同类事项随意采用不同标准",
    },
    "B",
    "公众参与、专家论证、风险评估和合法性审查是重大行政决策程序的重要组成。",
    "识别公开、参与、审查、留痕等程序关键词。",
    ["把效率等同于程序正当"],
  ],
  [
    "判断推理",
    "如果行业需求改善且公司现金流同步改善，则研究逻辑增强。现只知道行业需求改善，可以判断什么？",
    {
      A: "逻辑必然增强",
      B: "公司现金流必然改善",
      C: "条件尚不充分，需要继续核验现金流",
      D: "逻辑必然失效",
    },
    "C",
    "原命题要求两个条件同时满足，当前只满足其中一个，不能推出结论。",
    "把‘且’拆成两个必须同时核验的条件。",
    ["忽略合取条件中的第二项"],
  ],
  [
    "言语理解",
    "治理数字化不是简单把线下流程搬到线上，而是要以群众需求为起点重塑流程。该句主要强调什么？",
    {
      A: "增加线上入口数量",
      B: "数字化应推动以需求为导向的流程再造",
      C: "所有线下服务都应取消",
      D: "技术投入越多越好",
    },
    "B",
    "转折后的‘以群众需求为起点重塑流程’是主旨。",
    "抓住‘不是……而是……’后的重点。",
    ["只复述前半句"],
  ],
  [
    "数量关系",
    "某项目三阶段权重为 20%、30%、50%，得分分别为 80、90、70，综合得分是多少？",
    { A: "76", B: "77", C: "78", D: "79" },
    "C",
    "80×20%+90×30%+70×50%=16+27+35=78。",
    "分项得分乘权重后相加。",
    ["直接计算三个分数的算术平均"],
  ],
];

function citation(topic, date) {
  return {
    source_id: topic.sourceId,
    source_name: topic.sourceName,
    url: topic.url,
    title: "官方站点主页（仅用于演示来源字段）",
    published_at: generatedAt(date, "06:30:00"),
    note: "demo：不对应具体报道，不可作为现实事实引用",
  };
}

function makeNews(date, dayIndex) {
  return topics.map((topic, index) => {
    const id = `news-${date}-${String(index + 1).padStart(2, "0")}`;
    const item = {
      ...meta(id, date, [topic.sourceId]),
      title: `演示议题｜${topic.title}`,
      category: topic.category,
      regions: topic.regions,
      published_at: generatedAt(
        date,
        `${String(6 + (index % 2)).padStart(2, "0")}:${String(5 + index * 4).padStart(2, "0")}:00`,
      ),
      collected_at: generatedAt(date, "07:00:00"),
      source_name: topic.sourceName,
      source_url: topic.url,
      summary: topic.summary,
      why_it_matters: topic.why,
      importance_score: 78 + ((index + dayIndex) % 17),
      reliability: "demo",
      tags: [...topic.tags, "demo"],
      facts: ["这是结构与交互演示内容，不陈述当日真实事件。"],
      inferences: ["正式分析需以至少一个原始来源和另一个独立来源交叉核验。"],
      citations: [citation(topic, date)],
      related_items: [],
      reading_minutes: 3 + (index % 3),
      is_demo: true,
    };
    item.content_hash = hash(item);
    return item;
  });
}

function makeDeepDives(date, news) {
  return news.slice(0, 3).map((item, index) => {
    const id = `deep-${date}-${index + 1}`;
    const topic = topics[index];
    const dive = {
      ...meta(id, date, item.source_ids),
      news_ids: [item.id],
      title: item.title.replace("演示议题｜", "深度拆解｜"),
      one_sentence: `用证据链理解“${topic.title}”，先确认事实，再讨论传导和边界。`,
      background:
        "复杂公共议题通常由制度、技术、周期和参与者行为共同塑造，不应把单日变化解释成单一原因。此处只演示分析结构。",
      timeline: [
        {
          time: "长期背景",
          label: "制度与产业条件逐步形成",
          status: "context",
        },
        {
          time: "当前观察",
          label: "等待可核验的政策、数据或公告",
          status: "demo",
        },
        {
          time: "后续变量",
          label: "用执行指标和结果数据检验判断",
          status: "watch",
        },
      ],
      stakeholders: ["政府部门", "市场主体", "研究机构", "普通居民"],
      mechanism:
        "先识别政策或技术改变了谁的成本与约束，再观察主体行为、行业扩散、金融定价和社会反馈；每一层都需要独立证据。",
      impact_chain: [
        "事件或政策信号",
        "主体成本与预期变化",
        "行业供需重新配置",
        "市场与公共服务反馈",
        "对中国与普通人的潜在影响",
      ],
      beneficiaries: [
        "具备合规能力和长期投入能力的组织",
        "能获得更高质量公共服务的群体",
      ],
      pressured_groups: ["依赖单一短期红利的主体", "数据与治理基础薄弱的组织"],
      short_term:
        "关注政策文本、公告口径和首批执行信号，避免用价格波动替代事实。",
      medium_term: "观察投入是否转化为订单、效率、就业和公共服务改善。",
      long_term: "判断制度能力、人才结构和产业生态是否形成可持续积累。",
      unknowns: [
        "现实事件尚未接入",
        "关键量化指标尚未采集",
        "参与方执行差异未知",
      ],
      confidence: "demo",
      student_insights: [
        "把专业概念翻译成可观察指标",
        "区分事实、机制推断与价值判断",
        "为申论积累问题—原因—对策结构",
      ],
      shenlun_material: {
        theme: topic.tags[0],
        expressions: [
          "坚持发展和规范并重",
          "以制度供给提升治理效能",
          "形成目标明确、执行有力、反馈及时的工作闭环",
        ],
        case: "本卡片为原创结构示例，正式案例需补充真实时间、地点、做法、成效和来源。",
        argument:
          "新技术或新制度只有转化为可感知的公共价值，才能实现发展质量与治理效能的统一。",
      },
      citations: item.citations,
      is_demo: true,
    };
    dive.content_hash = hash(dive);
    return dive;
  });
}

function dataPoint(value, unit, date, note = "demo 示例值，不对应真实行情") {
  return {
    value,
    unit,
    source: "demo-generator",
    data_time: `${date}T15:00:00+08:00`,
    adjusted: false,
    realtime: false,
    estimated: true,
    missing: value === null,
    note,
  };
}

function makeMarket(date, dayIndex) {
  const isWeekend = date === "2026-08-29";
  const tradingDate = isWeekend ? "2026-08-28" : date;
  const indexNames = [
    ["000001", "上证指数"],
    ["399001", "深证成指"],
    ["399006", "创业板指"],
    ["000300", "沪深300"],
    ["000905", "中证500"],
    ["000688", "科创50"],
  ];
  const indices = indexNames.map(([code, name], index) => ({
    code,
    name,
    close: dataPoint(3000 + index * 420 + dayIndex * 12, "点", tradingDate),
    change_pct: dataPoint(
      Number((((index % 3) - 1) * 0.42 + dayIndex * 0.08).toFixed(2)),
      "%",
      tradingDate,
    ),
    turnover: dataPoint(3500 + index * 260, "亿元", tradingDate),
    trend: [98, 99, 98.5, 100, 101, 100.4, 101.2].map(
      (value) => value + index * 0.3,
    ),
  }));
  const source = {
    source_id: "demo-market",
    source_name: "演示数据生成器",
    url: "https://www.sse.com.cn/",
    title: "上海证券交易所主页（仅演示来源字段）",
    note: "数值为 demo，不来自该站点",
  };
  const candidate = {
    code: "000000",
    name: "演示制造（非真实证券）",
    industry: "先进制造（demo）",
    selected: true,
    no_selection_reason: null,
    score: 73,
    score_breakdown: {
      行业景气度: 15,
      公司基本面质量: 19,
      估值合理性: 10,
      量价与关注度: 9,
      催化因素: 12,
      信息可靠性: 8,
      风险扣分: 0,
    },
    business_model:
      "演示企业通过设备销售与运维服务获得收入，仅用于展示研究报告字段。",
    selection_reason:
      "该标的不存在，不是推荐；用于演示基本面、估值、催化、风险和证伪条件如何同时呈现。",
    fundamentals: {
      营业收入趋势: "demo：连续三期温和增长",
      净利润趋势: "demo：波动",
      扣非净利润: "demo：与净利润方向一致",
      毛利率: "demo：24%",
      净利率: "demo：8%",
      ROE: "demo：10%",
      经营现金流: "demo：为正但低于净利润",
      资产负债率: "demo：46%",
      应收账款: "demo：需关注增速",
      存货: "demo：周转放缓",
      资本开支: "demo：扩产阶段",
      最近一期: "无真实期间",
    },
    valuation: {
      PE: "demo：18x",
      PB: "demo：2.1x",
      PS: "demo：1.5x",
      历史分位: "demo：55%",
      可比公司: "未接入真实可比数据",
      边界: "周期和会计口径变化会降低横向可比性",
    },
    technical_snapshot: {
      均线: "demo：位于20日线上方",
      成交量: "demo：温和放大",
      换手率: "demo：中性",
      波动率: "demo：中等",
      支撑压力: "仅作结构展示，不给出价格区间",
    },
    catalysts: ["demo：订单兑现", "demo：产能利用率改善", "demo：行业标准落地"],
    risks: [
      "行业需求回落",
      "客户集中度过高",
      "现金流与利润背离",
      "估值收缩",
      "交易拥挤",
      "政策节奏不及预期",
      "demo 数据不可用于决策",
    ],
    scenarios: {
      optimistic: "需求与现金流同步改善，且估值没有明显透支。",
      base: "订单平稳、盈利温和，维持跟踪。",
      pessimistic: "需求、回款或审计质量恶化，研究逻辑减弱。",
    },
    invalidation_conditions: [
      "真实数据无法支持示例假设",
      "经营现金流持续恶化",
      "核心客户或产品竞争力发生实质变化",
    ],
    conclusion: "数据不足，暂不判断",
    data_as_of: tradingDate,
    citations: [source],
    is_demo: true,
  };
  const market = {
    ...meta(`market-${date}`, date, ["demo-market"]),
    trading_date: tradingDate,
    market_status: "demo",
    status_note: isWeekend
      ? "周六：不生成当日行情，展示最近 demo 交易日 2026-08-28。"
      : "显式 demo 行情，仅用于页面和校验测试。",
    indices,
    market_breadth: {
      up: 2860 - dayIndex * 120,
      down: 2100 + dayIndex * 80,
      flat: 140,
      limit_up: 62,
      limit_down: 8,
      median_change_pct: 0.18 - dayIndex * 0.07,
    },
    turnover: dataPoint(11680 + dayIndex * 180, "亿元", tradingDate),
    sentiment: dayIndex === 0 ? "偏强" : "中性",
    sentiment_basis: [
      "demo：上涨家数与下跌家数之差",
      "demo：全市场成交额变化",
      "demo：市场中位数涨跌幅与涨跌停结构",
    ],
    sectors: [
      {
        name: "先进制造（demo）",
        change_pct: 1.8,
        heat_score: 78,
        driver_type: "demo",
        catalyst: "结构演示：政策与订单共振",
        chain: ["设备", "核心零部件", "系统集成", "终端应用"],
        sustainability: "需验证订单与现金流",
        watch_next: "成交额与板块上涨广度",
        invalidation: "只有少数样本上涨且无基本面验证",
        representatives: ["不列真实公司，避免误导"],
        risk: "情绪透支",
      },
      {
        name: "数字基础设施（demo）",
        change_pct: 1.1,
        heat_score: 70,
        driver_type: "demo",
        catalyst: "结构演示：需求预期",
        chain: ["算力芯片", "服务器", "数据中心", "行业应用"],
        sustainability: "取决于利用率和商业化",
        watch_next: "资本开支与利用率",
        invalidation: "投入增长但收入和利用率不改善",
        representatives: ["不列真实公司，避免误导"],
        risk: "重复建设",
      },
      {
        name: "绿色产业（demo）",
        change_pct: -0.6,
        heat_score: 54,
        driver_type: "demo",
        catalyst: "结构演示：供需再平衡",
        chain: ["材料", "设备", "制造", "运营"],
        sustainability: "需观察库存与价格",
        watch_next: "库存去化与盈利修复",
        invalidation: "价格继续下行且现金流恶化",
        representatives: ["不列真实公司，避免误导"],
        risk: "产能过剩",
      },
    ],
    research_candidate: candidate,
    data_quality: {
      status: "demo",
      completeness: 1,
      conflicts: [],
      notes: [
        "全部数值为 demo",
        "不可用于投资决策",
        "正式模式会逐字段记录真实来源和单位",
      ],
    },
    sources: [source],
    is_demo: true,
  };
  market.content_hash = hash(market);
  return market;
}

function makeQuestions(date) {
  return baseQuestions.map(
    ([type, stem, options, answer, explanation, fastest, traps], index) => {
      const item = {
        ...meta(`q-${date}-${index + 1}`, date, []),
        source_type: "original_demo",
        source_name: "知势原创 demo",
        year: 2026,
        region: "通用",
        exam_type: "国考/江西省考能力训练",
        question_type: type,
        difficulty: index % 3 === 0 ? "基础" : "中等",
        stem,
        material: null,
        options,
        correct_answer: answer,
        explanation,
        fastest_method: fastest,
        traps,
        suggested_seconds: type === "资料分析" || type === "数量关系" ? 90 : 60,
        tags: [type, "原创", "demo"],
        is_demo: true,
      };
      item.content_hash = hash(item);
      return item;
    },
  );
}

function makeShenlun(date, isSunday = false) {
  const source = {
    source_id: "demo-nanchang",
    source_name: "南昌市人民政府（结构演示）",
    url: "https://www.nc.gov.cn/",
    title: "官方站点主页（仅演示来源字段）",
    note: "案例内容为原创 demo，不对应具体项目",
  };
  const item = {
    ...meta(`shenlun-${date}`, date, ["demo-nanchang"]),
    current_affairs: [
      {
        title: "数字政府的服务闭环",
        event_summary: "原创 demo：某地整合分散事项并建立反馈回访。",
        policy_background: "推进政务服务标准化、规范化、便利化。",
        theme: "数字政府",
        arguments: ["技术赋能必须服务群众需求", "数据共享要与安全责任同步"],
        case: "虚构案例，仅用于答题结构训练。",
        suitable_questions: ["概括题", "对策题"],
      },
      {
        title: "青年就业的能力与岗位匹配",
        event_summary: "原创 demo：高校、园区和企业共建实训清单。",
        policy_background: "就业优先与人才强省。",
        theme: "青年就业",
        arguments: [
          "提高人才培养与产业需求的适配度",
          "完善从实训到就业的服务链",
        ],
        case: "虚构案例，仅用于答题结构训练。",
        suitable_questions: ["分析题", "综合题"],
      },
      {
        title: "县域产业数字化",
        event_summary: "原创 demo：为中小企业提供低门槛数字工具。",
        policy_background: "数字经济与实体经济深度融合。",
        theme: "江西发展",
        arguments: ["降低中小企业转型门槛", "以场景牵引技术落地"],
        case: "虚构案例，仅用于答题结构训练。",
        suitable_questions: ["对策题", "公文写作"],
      },
    ],
    golden_sentences: [
      {
        type: "系统原创总结句",
        text: "治理的温度，体现在群众少跑的一段路、少填的一张表和更快得到的一次回应。",
      },
      {
        type: "政策规范表达",
        text: "以需求牵引场景开放，以场景促进技术迭代，以制度保障规范发展。",
      },
      {
        type: "系统原创总结句",
        text: "数字化不是给旧流程加一块屏幕，而是用公共价值重新审视每一个环节。",
      },
    ],
    standard_expressions: [
      {
        plain: "大家办事比较麻烦",
        formal: "公共服务流程仍有优化空间",
        scenario: "政务服务、营商环境",
        example: "应围绕高频事项再造流程，减少重复提交和多头跑动。",
      },
      {
        plain: "部门之间数据对不上",
        formal: "跨部门数据标准与协同机制尚不健全",
        scenario: "数字政府、基层治理",
        example: "统一数据口径、责任边界和更新频率，提升协同治理能力。",
      },
      {
        plain: "年轻人找工作和企业招人都难",
        formal: "人才供给与产业需求存在结构性错配",
        scenario: "青年就业、先进制造",
        example: "推动课程、实训和岗位标准衔接，提高人岗匹配效率。",
      },
    ],
    case_material: {
      name: "南昌便民服务闭环（原创 demo）",
      time_place: "虚构时间，江西南昌",
      practice: "整合高频事项、建立一次告知和办后回访。",
      problem: "材料重复、跨部门协同慢。",
      result: "不提供虚构成效数字，仅演示案例字段。",
      lesson: "流程再造、数据协同和反馈纠偏缺一不可。",
      themes: ["数字政府", "营商环境", "江西发展"],
      limitation: "非真实案例，不得作为事实引用。",
      source,
    },
    micro_practice: {
      type: "对策题",
      material:
        "某地上线多个政务小程序，但群众仍需反复提交同一材料；基层工作人员还要把线上数据手工录入不同系统。部分老年人不会使用智能手机，线下窗口却被大幅压缩。",
      requirement: "请概括问题并提出有针对性的改进建议。",
      word_limit: 300,
      reference_answer:
        "问题在于平台分散、数据标准不一、线上线下流程割裂以及特殊群体服务不足。应统一入口与数据标准，明确共享责任，推动后台系统互联和业务流程再造；保留必要线下窗口与帮办服务；建立群众反馈、运行监测和定期评估机制，持续纠偏。",
      scoring_points: [
        "平台整合",
        "数据共享",
        "流程再造",
        "特殊群体服务",
        "反馈评估",
      ],
      common_mistakes: ["只提增加技术投入", "对策与问题不对应", "忽略线下兜底"],
      strong_expressions: [
        "推动数据通、业务通、服务通",
        "坚持线上提效与线下兜底并重",
      ],
    },
    weekly_essay: isSunday
      ? {
          theme: "数字化与治理现代化",
          title: "让数字技术更好服务人民生活",
          thesis: "以人民需求校准数字化方向，以制度建设保障技术向善。",
          arguments: [
            "流程再造提升服务效能",
            "规则治理守住安全边界",
            "数字包容共享发展成果",
          ],
          outline: ["问题引入", "三个分论点", "江西场景", "总结升华"],
        }
      : null,
    is_demo: true,
  };
  item.content_hash = hash(item);
  return item;
}

function makeDigest(date, dayIndex) {
  const news = makeNews(date, dayIndex);
  const deepDives = makeDeepDives(date, news);
  const shenlun = makeShenlun(date, false);
  const exam = {
    ...meta(`exam-${date}`, date),
    questions: makeQuestions(date),
    shenlun,
    is_demo: true,
  };
  exam.content_hash = hash(exam);
  const digest = {
    ...meta(`daily-${date}`, date, [
      ...new Set(news.flatMap((item) => item.source_ids)),
    ]),
    title: `${date} 每日研判与公考学习看板`,
    overview:
      "今日内容为显式 demo：用 20—40 分钟完成 8 条议题浏览、3 条逻辑链拆解、A 股研究结构复盘和 8 道原创行测练习。",
    is_demo: true,
    task_statuses: [
      {
        module: "exam",
        scheduled_time: "06:45",
        last_run: generatedAt(date, "06:45:00"),
        status: "demo",
        freshness: "demo",
        message: "原创 demo 已生成",
      },
      {
        module: "news",
        scheduled_time: "07:15",
        last_run: generatedAt(date, "07:15:00"),
        status: "demo",
        freshness: "demo",
        message: "结构演示内容，不是实时新闻",
      },
      {
        module: "market",
        scheduled_time: "18:25",
        last_run: generatedAt(date, "18:25:00"),
        status: "demo",
        freshness: "demo",
        message: "示例行情，不用于投资决策",
      },
    ],
    news,
    deep_dives: deepDives,
    market: makeMarket(date, dayIndex),
    exam,
  };
  digest.content_hash = hash(digest);
  return digest;
}

function markdown(digest) {
  const lines = [
    `# ${digest.title}`,
    "",
    "> **DEMO / 非实时数据**：本文只用于展示数据结构、页面与学习流程，不可作为新闻事实或投资依据。",
    "",
    digest.overview,
    "",
    "## 新闻议题",
    "",
    ...digest.news.flatMap((item) => [
      `### ${item.title}`,
      "",
      `${item.summary}`,
      "",
      `- 重要性：${item.importance_score}/100（demo）`,
      `- 来源字段：[${item.source_name}](${item.source_url})`,
      "",
    ]),
    "## 深度剖析",
    "",
    ...digest.deep_dives.flatMap((item) => [
      `### ${item.title}`,
      "",
      item.one_sentence,
      "",
      `传导链：${item.impact_chain.join(" → ")}`,
      "",
    ]),
    "## A 股研究结构",
    "",
    `- 状态：${digest.market.status_note}`,
    `- 情绪：${digest.market.sentiment}（demo）`,
    `- 研究标的：${digest.market.research_candidate.name}；结论：${digest.market.research_candidate.conclusion}`,
    "",
    "## 行测每日一练",
    "",
    ...digest.exam.questions.map((q, index) => `${index + 1}. ${q.stem}`),
    "",
    "## 申论微练习",
    "",
    digest.exam.shenlun.micro_practice.material,
    "",
    `**要求**：${digest.exam.shenlun.micro_practice.requirement}（不超过 ${digest.exam.shenlun.micro_practice.word_limit} 字）`,
    "",
  ];
  return `${lines.join("\n").trimEnd()}\n`;
}

async function writeJson(target, value) {
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

const digests = dates.map(makeDigest);
for (const digest of digests) {
  const [year, month] = digest.date.split("-");
  const dataDir = path.join(root, "data", "daily", year, month);
  await writeJson(path.join(dataDir, `${digest.date}.json`), digest);
  await mkdir(dataDir, { recursive: true });
  await writeFile(
    path.join(dataDir, `${digest.date}.md`),
    markdown(digest),
    "utf8",
  );

  for (const [moduleName, value] of [
    [
      "news",
      {
        ...meta(`news-daily-${digest.date}`, digest.date),
        items: digest.news,
        deep_dives: digest.deep_dives,
      },
    ],
    ["market", digest.market],
    ["exam", digest.exam],
  ]) {
    const moduleDir = path.join(root, "data", moduleName, year, month);
    await writeJson(path.join(moduleDir, `${digest.date}.json`), value);
    await mkdir(moduleDir, { recursive: true });
    await writeFile(
      path.join(moduleDir, `${digest.date}.md`),
      `# ${digest.date} ${moduleName}\n\n> DEMO / 非实时数据。\n`,
      "utf8",
    );
  }
}

const archive = {
  schema_version: schemaVersion,
  generated_at: generatedAt(dates.at(-1), "19:00:00"),
  timezone: "Asia/Shanghai",
  entries: digests
    .map((digest) => ({
      date: digest.date,
      title: digest.title,
      mode: "demo",
      news_count: digest.news.length,
      deep_dive_count: digest.deep_dives.length,
      question_count: digest.exam.questions.length,
      market_status: digest.market.market_status,
      path: `/daily/${digest.date}/`,
    }))
    .reverse(),
};

await writeJson(
  path.join(root, "data", "manifests", "latest.json"),
  digests.at(-1),
);
await writeJson(
  path.join(root, "data", "manifests", "archive-index.json"),
  archive,
);
await writeJson(
  path.join(root, "public", "data", "latest.json"),
  digests.at(-1),
);
await writeJson(
  path.join(root, "public", "data", "archive-index.json"),
  archive,
);
for (const digest of digests)
  await writeJson(
    path.join(root, "public", "data", "daily", `${digest.date}.json`),
    digest,
  );

console.log(
  `Generated ${digests.length} demo digests, ${digests.reduce((n, d) => n + d.news.length, 0)} news items, ${digests.reduce((n, d) => n + d.exam.questions.length, 0)} original questions.`,
);
