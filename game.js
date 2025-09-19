// 游戏状态管理
class GameState {
    constructor() {
        this.currentCharacter = null;
        this.selectedPositions = [];
        this.remainingApplications = 2;
        this.currentQuestion = 0;
        this.correctAnswers = 0;
        this.totalQuestions = 5;
        this.interviewTimer = null;
        this.timeLeft = 30;
        this.isInterviewActive = false;
        // 角色好感度：key 为角色标识，值为 0-3 星
        try {
            const stored = localStorage.getItem('favorability');
            this.favorability = stored ? JSON.parse(stored) : {};
        } catch (_) {
            this.favorability = {};
        }
    }

    reset() {
        this.currentCharacter = null;
        this.selectedPositions = [];
        this.passedPositions = [];
        this.companyResults = [];
        this.currentInterviewIndex = 0;
        this.remainingApplications = 2;
        this.currentQuestion = 0;
        this.correctAnswers = 0;
        this.totalQuestions = 5;
        this.timeLeft = 30;
        this.isInterviewActive = false;
        if (this.interviewTimer) {
            clearInterval(this.interviewTimer);
            this.interviewTimer = null;
        }
    }
}

// 更新并持久化角色好感度（取历史最高）
function updateFavorability(characterKey, stars) {
    const current = game.favorability[characterKey] || 0;
    const next = Math.max(current, stars);
    game.favorability[characterKey] = next;
    try {
        localStorage.setItem('favorability', JSON.stringify(game.favorability));
    } catch (_) {}
}

// 更新特定公司的好感度（每家公司独立计算）
function updateCompanyFavorability(characterKey, positionId, stars) {
    const companyKey = `${characterKey}_${positionId}`;
    const current = game.favorability[companyKey] || 0;
    const next = Math.max(current, stars);
    game.favorability[companyKey] = next;
    try {
        localStorage.setItem('favorability', JSON.stringify(game.favorability));
    } catch (_) {}
}

// 渲染首页角色卡片的星级显示（分别显示两家公司的星级）
function renderHomeStars() {
    document.querySelectorAll('.character-card').forEach(card => {
        const key = card.dataset.character;
        const starsRows = card.querySelectorAll('.stars-row');
        
        if (starsRows.length >= 2) {
            // 获取该角色的所有公司好感度
            const companyFavorabilities = [];
            if (game.favorability) {
                Object.keys(game.favorability).forEach(favorKey => {
                    if (favorKey.startsWith(key + '_')) {
                        companyFavorabilities.push(game.favorability[favorKey] || 0);
                    }
                });
            }
            
            // 为每行星星设置对应的公司好感度
            starsRows.forEach((row, rowIndex) => {
                const stars = row.querySelectorAll('.star');
                const favorability = companyFavorabilities[rowIndex] || 0;
                
                stars.forEach((starEl, index) => {
                    starEl.style.color = index < favorability ? '#ffd700' : '#e2e8f0';
                });
            });
        }
    });
}

// 角色数据
const characters = {
    student: {
        name: "林小萌",
        avatar: "🎓",
        background: [
            "国内重点大学本科应届毕业生，管理学专业",
            "两家互联网公司暑期实习经历（项目助理、运营实习生）",
            "22岁，积极乐观、细心谨慎、有责任心、适应性强",
            "专业技能：办公软件精通、数据分析基础、文案撰写、活动策划"
        ],
        tags: ["应届生", "管理学", "实习经验", "办公软件精通", "数据分析基础", "文案撰写", "活动策划", "英语六级", "日语N3"],
        highlightedTags: ["应届生", "实习经验", "数据分析基础"],
        intentions: [
            "期望行业：互联网/新媒体/教育/文化创意",
            "薪资期望：8000-12000元/月（一线或新一线城市）",
            "职业发展：学习成长空间、明确晋升通道",
            "希望有良好的成长环境和团队氛围"
        ],
        ability: "可爱小白纸，获得面试邀请机会+1"
    },
    experienced: {
        name: "赵昊",
        avatar: "💼",
        background: [
            "35岁，普通本科院校管理学专业毕业",
            "8年互联网大厂经验，历任运营、项目经理，现任某二线厂部门负责人",
            "核心技能：跨部门协调、资源整合、向上管理、项目包装汇报、危机公关",
            "软实力：人际洞察力、情绪价值提供、信息中介能力、风险转移",
            "短板：技术盲区、深度数据分析依赖下属、战略规划系统性不足"
        ],
        tags: ["跨部门协调", "资源整合", "向上管理", "项目包装", "危机公关", "8年经验"],
        highlightedTags: ["跨部门协调", "资源整合", "向上管理"],
        intentions: [
            "期望岗位：互联网中高层管理（总监/高级经理）",
            "薪资期望：年薪80-120万（含期权）",
            "偏好：强资源支持部门、易出成绩的'明星业务'、老板授权充分",
            "注重工作生活平衡，避免高强度技术工作"
        ],
        ability: "向上管理，面试通过率+20%"
    },
    careerChanger: {
        name: "王强",
        avatar: "🔄",
        background: [
            "28岁，普通本科院校计算机专业毕业",
            "5年小厂经验，一人身兼多职，抗压能力极强",
            "能够同时处理多项任务，并保证效率和质量",
            "面对新领域和新技能能快速上手，适应能力强",
            "面对高强度工作和突发状况能保持冷静，有效解决问题",
            "能够快速理解并执行上级指令，保质保量完成任务"
        ],
        tags: ["多任务处理", "快速学习", "抗压能力", "执行力强", "5年经验", "小厂背景"],
        highlightedTags: ["多任务处理", "快速学习", "抗压能力"],
        intentions: [
            "期望岗位：技术管理、架构师",
            "薪资期望：年薪50-80万（可比之前降低，但需稳定）",
            "偏好：稳定发展的企业、技术氛围好、有学习成长空间",
            "愿意承担更多责任和挑战"
        ],
        ability: "多任务处理，抗压能力+40%"
    },
    entrepreneur: {
        name: "陈伟",
        avatar: "🚀",
        background: [
            "38岁，普通本科院校计算机专业毕业",
            "12年互联网大厂经验，历任开发、技术经理，最近因公司业务调整被裁员",
            "已婚有孩，有房贷车贷压力，面临中年危机",
            "核心技术：Java技术栈、系统架构、项目管理、团队协调",
            "软实力：抗压能力、流程优化、跨部门沟通",
            "短板：新技术学习速度慢、AI技能不足、创业经验缺乏"
        ],
        tags: ["Java技术栈", "系统架构", "项目管理", "团队协调", "抗压能力", "12年经验"],
        highlightedTags: ["Java技术栈", "系统架构", "项目管理"],
        intentions: [
            "期望岗位：技术管理、架构师",
            "薪资期望：年薪50-80万（可比之前降低，但需稳定）",
            "偏好：稳定发展的企业、技术氛围好、有学习成长空间",
            "注重工作稳定性和家庭责任"
        ],
        ability: "技术深度，项目管理能力+30%"
    }
};

// 职位数据
const positions = {
    student: [
        {
            id: 1,
            company: "星芒科技有限公司",
            title: "互联网运营岗",
            salary: "9000-13000元/月",
            responsibilities: "产品运营及数据分析，用户反馈处理，活动策划与执行",
            requirements: "数据分析能力，沟通协调能力，办公软件精通，创新思维",
            matchScore: 95,
            isFraud: false
        },
        {
            id: 2,
            company: "创想文化传媒",
            title: "新媒体运营岗",
            salary: "7500-10000元/月",
            responsibilities: "新媒体内容策划与创作，社交媒体运营，视频脚本撰写与拍摄协助",
            requirements: "创意策划能力，文案撰写能力，社交媒体运营经验，内容创作能力",
            matchScore: 90,
            isFraud: false
        },
        {
            id: 3,
            company: "智汇教育集团",
            title: "课程助理岗",
            salary: "8000-11000元/月",
            responsibilities: "课程设计与开发协助，学员管理沟通，教学资料整理",
            requirements: "沟通表达能力，文案撰写能力，组织协调能力，耐心细致",
            matchScore: 60,
            isFraud: false
        },
        {
            id: 4,
            company: "青云咨询有限公司",
            title: "市场调研助理",
            salary: "10000-14000元/月",
            responsibilities: "市场调研与数据分析，咨询报告撰写协助，客户会议支持",
            requirements: "数据分析能力，逻辑思维能力，市场分析基础，报告撰写能力",
            matchScore: 50,
            isFraud: false
        },
        {
            id: 5,
            company: "未来科技有限公司",
            title: "AI产品助理",
            salary: "12000-16000元/月",
            responsibilities: "AI产品测试与优化协助，用户需求调研，技术文档整理",
            requirements: "逻辑分析能力，技术理解基础，沟通协调能力，文档撰写能力",
            matchScore: 40,
            isFraud: false
        },
        {
            id: 6,
            company: "海外高薪招聘",
            title: "海外客服专员",
            salary: "25000-35000元/月",
            responsibilities: "负责海外客户服务，处理客户咨询，维护客户关系",
            requirements: "英语流利，无经验要求，包吃包住，工作轻松",
            matchScore: 95,
            isFraud: true
        }
    ],
    experienced: [
        {
            id: 1,
            company: "星海科技",
            title: "业务发展总监",
            salary: "90-130万",
            responsibilities: "资源整合与生态合作，跨部门推动，商务谈判与包装",
            requirements: "资源整合与生态合作能力，跨部门推动力，商务谈判与包装能力",
            matchScore: 100,
            isFraud: false
        },
        {
            id: 2,
            company: "闪电出行",
            title: "运营高级经理",
            salary: "70-100万",
            responsibilities: "本地化资源协调，政府关系辅助，危机事件处理",
            requirements: "本地化资源协调能力，政府关系辅助能力，危机事件处理能力",
            matchScore: 100,
            isFraud: false
        },
        {
            id: 3,
            company: "青云咨询",
            title: "数字化转型顾问",
            salary: "60-90万",
            responsibilities: "传统企业客户沟通，方案包装与汇报，项目风险规避",
            requirements: "传统企业客户沟通能力，方案包装与汇报能力，项目风险规避能力",
            matchScore: 60,
            isFraud: false
        },
        {
            id: 4,
            company: "极致娱乐",
            title: "发行合作总监",
            salary: "80-120万",
            responsibilities: "渠道关系维护，市场活动策划，数据包装汇报",
            requirements: "渠道关系维护能力，市场活动策划能力，数据包装汇报能力",
            matchScore: 60,
            isFraud: false
        },
        {
            id: 5,
            company: "智汇教育",
            title: "增长负责人",
            salary: "75-110万",
            responsibilities: "增长渠道整合，低成本获客，团队管理",
            requirements: "增长渠道整合能力，低成本获客能力，团队管理能力",
            matchScore: 60,
            isFraud: false
        }
    ],
    careerChanger: [
        {
            id: 1,
            company: "稳达科技",
            title: "技术总监",
            salary: "60-90万",
            responsibilities: "团队管理经验，系统架构能力，稳定性保障",
            requirements: "团队管理经验，系统架构能力，稳定性",
            matchScore: 100,
            isFraud: false
        },
        {
            id: 2,
            company: "智云互联",
            title: "技术经理",
            salary: "50-70万",
            responsibilities: "技术团队管理，项目交付能力，成本控制",
            requirements: "技术团队管理，项目交付能力，成本控制",
            matchScore: 100,
            isFraud: false
        },
        {
            id: 3,
            company: "青云咨询",
            title: "资深咨询顾问",
            salary: "70-100万",
            responsibilities: "客户沟通能力，解决方案设计，行业经验",
            requirements: "客户沟通能力，解决方案设计，行业经验",
            matchScore: 60,
            isFraud: false
        },
        {
            id: 4,
            company: "创新工场",
            title: "技术合伙人",
            salary: "40-60万 + 期权",
            responsibilities: "技术全面性，抗压能力，创业精神",
            requirements: "技术全面性，抗压能力，创业精神",
            matchScore: 60,
            isFraud: false
        },
        {
            id: 5,
            company: "教育科技",
            title: "技术架构师",
            salary: "55-75万",
            responsibilities: "系统架构能力，高并发经验，稳定性",
            requirements: "系统架构能力，高并发经验，稳定性",
            matchScore: 60,
            isFraud: false
        }
    ],
    entrepreneur: [
        {
            id: 1,
            company: "稳达科技",
            title: "技术总监",
            salary: "60-90万",
            responsibilities: "团队管理经验，系统架构能力，稳定性保障",
            requirements: "团队管理经验，系统架构能力，稳定性",
            matchScore: 100,
            isFraud: false
        },
        {
            id: 2,
            company: "智云互联",
            title: "技术经理",
            salary: "50-70万",
            responsibilities: "技术团队管理，项目交付能力，成本控制",
            requirements: "技术团队管理，项目交付能力，成本控制",
            matchScore: 100,
            isFraud: false
        },
        {
            id: 3,
            company: "青云咨询",
            title: "资深咨询顾问",
            salary: "70-100万",
            responsibilities: "客户沟通能力，解决方案设计，行业经验",
            requirements: "客户沟通能力，解决方案设计，行业经验",
            matchScore: 60,
            isFraud: false
        },
        {
            id: 4,
            company: "创新工场",
            title: "技术合伙人",
            salary: "40-60万 + 期权",
            responsibilities: "技术全面性，抗压能力，创业精神",
            requirements: "技术全面性，抗压能力，创业精神",
            matchScore: 60,
            isFraud: false
        },
        {
            id: 5,
            company: "教育科技",
            title: "技术架构师",
            salary: "55-75万",
            responsibilities: "系统架构能力，高并发经验，稳定性",
            requirements: "系统架构能力，高并发经验，稳定性",
            matchScore: 60,
            isFraud: false
        }
    ]
};

// 面试题目数据
const interviewQuestions = {
    student: [
        {
            type: "结构化面试题",
            question: "你选择互联网运营岗位的核心动机是什么？",
            options: [
                "因为运营工作轻松，不用写代码",
                "成长型选手——认为运营能综合锻炼数据、策划、沟通能力，长期发展空间大",
                "听说运营工资高，想试试"
            ],
            correct: 1
        },
        {
            type: "结构化面试题",
            question: "如果老板要求你一周内提升某功能用户留存率，但资源有限，你会优先怎么做？",
            options: [
                "直接策划一个大型活动，吸引更多用户",
                "先分析现有用户行为数据，优化功能流程并策划针对性活动",
                "找其他同事帮忙，大家一起想办法"
            ],
            correct: 1
        },
        {
            type: "专业能力题",
            question: "某新功能上线后次日留存率从40%跌至35%，以下哪种分析方向最合理？",
            options: [
                "立即下线功能，避免进一步损失",
                "先排查技术问题(如BUG)、用户反馈，再对比同期活动干扰因素",
                "加大推广力度，用更多用户掩盖留存率下降"
            ],
            correct: 1
        },
        {
            type: "专业能力题",
            question: "为提升用户活跃度，以下哪种活动策划最有效？",
            options: [
                "直接发放现金红包，吸引用户参与",
                "设计签到+任务奖励体系，结合用户分层提供差异化福利",
                "邀请明星代言，提高品牌知名度"
            ],
            correct: 1
        },
        {
            type: "情景模拟题",
            question: "同时收到老板催方案、用户投诉差评、同事求助改稿，优先处理哪个？",
            options: [
                "先处理老板的方案，其他事情往后放",
                "先回同事稍等，再快速回复用户安抚情绪，同步向老板申请延期1小时",
                "先处理用户投诉，因为影响公司形象"
            ],
            correct: 1
        }
    ],
    // 创想文化传媒新媒体运营岗面试题
    student_media: [
        {
            type: "结构化面试题",
            question: "你为何认为自己是新媒体运营的合适人选？",
            options: [
                "因为我经常刷抖音、小红书，很了解这些平台",
                "内容+数据双驱动——擅长文案策划与数据分析，能平衡创意与效果",
                "因为我喜欢写东西，文笔还不错"
            ],
            correct: 1
        },
        {
            type: "结构化面试题",
            question: "如果连续3篇内容数据未达预期，你会怎么做？",
            options: [
                "直接放弃，换其他内容方向",
                "先喝奶茶缓一缓，然后复盘数据、找同事蹭灵感、调整方向",
                "继续坚持，相信总会火的"
            ],
            correct: 1
        },
        {
            type: "专业能力题",
            question: "为宠物品牌策划小红书爆款笔记，以下哪种思路最有效？",
            options: [
                "直接发产品广告，突出产品优势",
                "用铲屎官吐槽大会主题征集用户搞笑故事，附产品软植入",
                "找网红代言，提高曝光度"
            ],
            correct: 1
        },
        {
            type: "专业能力题",
            question: "如何快速判断一篇社交媒体内容是否具备爆款潜力？",
            options: [
                "看标题是否吸引人，内容是否有趣",
                "分析点击率、互动率、分享率等数据指标，结合热点匹配度",
                "凭感觉，觉得好就发"
            ],
            correct: 1
        },
        {
            type: "情景模拟题",
            question: "品牌合作方临时要求修改已发布内容的文案，但粉丝已在负面评论，如何处理？",
            options: [
                "直接删除原内容，重新发布",
                "先下架原内容，同步与合作方沟通确认修订方案，再发布新版并评论区说明",
                "不管粉丝评论，按合作方要求修改"
            ],
            correct: 1
        }
    ],
    experienced: [
        {
            type: "结构化题",
            question: "你如何定义'业务发展'的核心价值？",
            options: [
                "拼命拓新渠道，数量压倒质量",
                "整合内外部资源，用最小成本撬动最大生态价值",
                "等老板指示方向，避免犯错"
            ],
            correct: 1
        },
        {
            type: "结构化题",
            question: "空降新团队发现下属消极抵触，你优先做什么？",
            options: [
                "开会画饼'跟我干有肉吃'",
                "逐个约谈摸清诉求，优先争取关键骨干，快速小事立威",
                "向老板申请换血名额"
            ],
            correct: 1
        },
        {
            type: "专业题",
            question: "如何推动技术部门优先支持你的项目？",
            options: [
                "投诉技术老大不配合",
                "拉通技术老板对齐业务价值，用数据包装优先级，争取高层背书",
                "请技术团队吃饭搞关系"
            ],
            correct: 1
        },
        {
            type: "专业题",
            question: "老板要求半年内将平台GMV提升200%，但资源有限，你怎么办？",
            options: [
                "要求老板先加预算再干活",
                "拆解目标：70%靠存量资源复用+20%杠杆合作+10%新尝试，每周汇报增量进展",
                "直接下调目标至50%"
            ],
            correct: 1
        },
        {
            type: "情景题",
            question: "合作方临时毁约且公开指责公司，你如何应对？",
            options: [
                "朋友圈回怼'小人背信'",
                "立即私下联系对方安抚，同步法务介入，对外统一'误会正在沟通'口径",
                "群发邮件甩锅给前接口人"
            ],
            correct: 1
        }
    ],
    experienced_lightning: [
        {
            type: "结构化题",
            question: "你如何看待'运营'在出行行业的作用？",
            options: [
                "就是地推拉新和用户客服",
                "平衡用户体验、司机收益、平台利润的三角关系，用规则设计实现动态最优",
                "每天盯数据报表做汇报"
            ],
            correct: 1
        },
        {
            type: "结构化题",
            question: "总部政策与城市本地情况冲突，你如何决策？",
            options: [
                "坚决执行总部政策",
                "收集本地数据案例，拉通总部政策部门协商弹性执行方案",
                "让城市团队自己瞒着总部搞"
            ],
            correct: 1
        },
        {
            type: "专业题",
            question: "如何降低司机端投诉率但不影响接单积极性？",
            options: [
                "严罚投诉多的司机",
                "设计司机荣誉体系+投诉仲裁机制，重点安抚头部司机，隔离问题司机",
                "隐藏投诉入口减少上报"
            ],
            correct: 1
        },
        {
            type: "专业题",
            question: "面对突然大规模补贴，你的应对策略？",
            options: [
                "申请更多预算跟补",
                "快速小范围测试补贴效率，同时包装'服务体验升级'话题转移用户关注点",
                "写报告分析竞对必死"
            ],
            correct: 1
        },
        {
            type: "情景题",
            question: "重大安全事故后舆情爆发，你首步行动？",
            options: [
                "等公关部回应",
                "立即启动内部事实核查，同步协调政府关系报备，准备用户安抚方案",
                "要求所有员工转发辟谣帖"
            ],
            correct: 1
        }
    ],
    careerChanger: [
        {
            type: "结构化题",
            question: "您为何离开上一家大厂平台？",
            options: [
                "抱怨前公司政治复杂，自己成为牺牲品",
                "坦言公司业务调整，整个部门被裁，但感恩平台培养，积累了宝贵经验",
                "吹嘘自己技术厉害，想寻找更大挑战"
            ],
            correct: 1
        },
        {
            type: "结构化题",
            question: "您如何保证技术团队的稳定性？",
            options: [
                "靠高薪留住人才",
                "建立清晰成长路径、技术分享氛围和参与感，结合有竞争力的薪酬",
                "严格考核，淘汰跟不上的人"
            ],
            correct: 1
        },
        {
            type: "专业题",
            question: "传统企业系统如何平稳迁移到云平台？",
            options: [
                "直接全部迁移，长痛不如短痛",
                "先评估、分模块迁移、灰度发布、建立回滚机制，保证业务连续性",
                "沿用老系统最安全，不建议迁移"
            ],
            correct: 1
        },
        {
            type: "专业题",
            question: "如何应对技术债务？",
            options: [
                "暂时不管，不影响业务就行",
                "定期评估、制定重构计划、与业务沟通争取资源、逐步偿还",
                "必须彻底重构，否则是隐患"
            ],
            correct: 1
        },
        {
            type: "情景题",
            question: "老板要求用新技术重构核心系统，但团队熟悉旧技术，如何决策？",
            options: [
                "强行推行新技术，不会就学",
                "评估风险、输出方案、争取试点资源、培训骨干、逐步推进",
                "听从老板，但让团队加班学"
            ],
            correct: 1
        }
    ],
    careerChanger_zhihui: [
        {
            type: "结构化题",
            question: "您如何看待中小互联网公司的技术挑战？",
            options: [
                "技术落后，不如大厂",
                "资源有限更需精打细算，技术要为业务快速迭代服务",
                "挑战不大，都能搞定"
            ],
            correct: 1
        },
        {
            type: "结构化题",
            question: "您过去的大厂经验如何应用到现在岗位？",
            options: [
                "照搬大厂流程规范",
                "提炼大厂方法论精髓，结合当前团队规模灵活应用",
                "大厂经验没什么用"
            ],
            correct: 1
        },
        {
            type: "专业题",
            question: "如何快速交付一个高质量项目？",
            options: [
                "让团队加班赶工",
                "明确优先级、简化流程、自动化工具、每日站会同步进度",
                "要求产品减少需求"
            ],
            correct: 1
        },
        {
            type: "专业题",
            question: "研发过程中突然插入高优先级需求怎么办？",
            options: [
                "拒绝接受，按计划进行",
                "评估影响、快速调整资源、与各方沟通新的时间预期",
                "接受，但牺牲质量"
            ],
            correct: 1
        },
        {
            type: "情景题",
            question: "核心员工提出离职，且项目正处于关键期，如何处理？",
            options: [
                "卡着不让他走",
                "沟通挽留、了解原因、组织知识转移、争取过渡期支持",
                "马上招聘新人"
            ],
            correct: 1
        }
    ],
    entrepreneur: [
        {
            type: "结构化题",
            question: "您为何离开上一家大厂平台？",
            options: [
                "抱怨前公司政治复杂，自己成为牺牲品",
                "坦言公司业务调整，整个部门被裁，但感恩平台培养，积累了宝贵经验",
                "吹嘘自己技术厉害，想寻找更大挑战"
            ],
            correct: 1
        },
        {
            type: "结构化题",
            question: "您如何保证技术团队的稳定性？",
            options: [
                "靠高薪留住人才",
                "建立清晰成长路径、技术分享氛围和参与感，结合有竞争力的薪酬",
                "严格考核，淘汰跟不上的人"
            ],
            correct: 1
        },
        {
            type: "专业题",
            question: "传统企业系统如何平稳迁移到云平台？",
            options: [
                "直接全部迁移，长痛不如短痛",
                "先评估、分模块迁移、灰度发布、建立回滚机制，保证业务连续性",
                "沿用老系统最安全，不建议迁移"
            ],
            correct: 1
        },
        {
            type: "专业题",
            question: "如何应对技术债务？",
            options: [
                "暂时不管，不影响业务就行",
                "定期评估、制定重构计划、与业务沟通争取资源、逐步偿还",
                "必须彻底重构，否则是隐患"
            ],
            correct: 1
        },
        {
            type: "情景题",
            question: "老板要求用新技术重构核心系统，但团队熟悉旧技术，如何决策？",
            options: [
                "强行推行新技术，不会就学",
                "评估风险、输出方案、争取试点资源、培训骨干、逐步推进",
                "听从老板，但让团队加班学"
            ],
            correct: 1
        }
    ],
    entrepreneur_zhihui: [
        {
            type: "结构化题",
            question: "您如何看待中小互联网公司的技术挑战？",
            options: [
                "技术落后，不如大厂",
                "资源有限更需精打细算，技术要为业务快速迭代服务",
                "挑战不大，都能搞定"
            ],
            correct: 1
        },
        {
            type: "结构化题",
            question: "您过去的大厂经验如何应用到现在岗位？",
            options: [
                "照搬大厂流程规范",
                "提炼大厂方法论精髓，结合当前团队规模灵活应用",
                "大厂经验没什么用"
            ],
            correct: 1
        },
        {
            type: "专业题",
            question: "如何快速交付一个高质量项目？",
            options: [
                "让团队加班赶工",
                "明确优先级、简化流程、自动化工具、每日站会同步进度",
                "要求产品减少需求"
            ],
            correct: 1
        },
        {
            type: "专业题",
            question: "研发过程中突然插入高优先级需求怎么办？",
            options: [
                "拒绝接受，按计划进行",
                "评估影响、快速调整资源、与各方沟通新的时间预期",
                "接受，但牺牲质量"
            ],
            correct: 1
        },
        {
            type: "情景题",
            question: "核心员工提出离职，且项目正处于关键期，如何处理？",
            options: [
                "卡着不让他走",
                "沟通挽留、了解原因、组织知识转移、争取过渡期支持",
                "马上招聘新人"
            ],
            correct: 1
        }
    ]
};

// 游戏实例
const game = new GameState();

// 背景音乐控制
class MusicController {
    constructor() {
        this.audio = document.getElementById('bgMusic');
        this.toggleBtn = document.getElementById('musicToggle');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.isPlaying = false;
        this.volume = 0.5;
        
        this.init();
    }
    
    init() {
        // 设置初始音量
        this.audio.volume = this.volume;
        
        // 播放/暂停按钮事件
        this.toggleBtn.addEventListener('click', () => {
            this.toggle();
        });
        
        // 音量滑块事件
        this.volumeSlider.addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });
        
        // 音频事件监听
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.updateButtonState();
        });
        
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updateButtonState();
        });
        
        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.updateButtonState();
        });
        
        // 自动播放（需要用户交互后才能播放）
        this.audio.addEventListener('canplaythrough', () => {
            // 尝试自动播放，如果失败则等待用户交互
            this.audio.play().catch(() => {
                console.log('自动播放被阻止，等待用户交互');
            });
        });
    }
    
    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    play() {
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.updateButtonState();
        }).catch((error) => {
            console.log('播放失败:', error);
            // 如果播放失败，可能是浏览器阻止了自动播放
            this.showPlayPrompt();
        });
    }
    
    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updateButtonState();
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.audio.volume = this.volume;
        this.volumeSlider.value = this.volume * 100;
    }
    
    updateButtonState() {
        if (this.isPlaying) {
            this.toggleBtn.classList.add('playing');
            this.toggleBtn.title = '暂停音乐';
        } else {
            this.toggleBtn.classList.remove('playing');
            this.toggleBtn.title = '播放音乐';
        }
    }
    
    showPlayPrompt() {
        // 可以在这里添加一个提示，告诉用户点击播放按钮
        console.log('请点击音乐按钮开始播放');
    }
}

// 初始化音乐控制器
const musicController = new MusicController();

// 新手教程控制器
class TutorialController {
    constructor() {
        this.tutorialModal = document.getElementById('tutorial-modal');
        this.tutorialConfirmBtn = document.getElementById('tutorial-confirm');
        this.hasSeenTutorial = localStorage.getItem('hasSeenTutorial') === 'true';
        
        this.init();
    }
    
    init() {
        // 检查是否已经看过教程
        if (!this.hasSeenTutorial) {
            this.showTutorial();
        } else {
            this.hideTutorial();
        }
        
        // 绑定确认按钮事件
        this.tutorialConfirmBtn.addEventListener('click', () => {
            this.hideTutorial();
            this.markTutorialAsSeen();
        });
        
        // 点击遮罩层也可以关闭教程
        this.tutorialModal.addEventListener('click', (e) => {
            if (e.target === this.tutorialModal) {
                this.hideTutorial();
                this.markTutorialAsSeen();
            }
        });
        
        // 键盘事件监听
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.tutorialModal.classList.contains('hidden')) {
                this.hideTutorial();
                this.markTutorialAsSeen();
            }
        });
    }
    
    showTutorial() {
        this.tutorialModal.classList.remove('hidden');
        // 阻止背景滚动
        document.body.style.overflow = 'hidden';
    }
    
    hideTutorial() {
        this.tutorialModal.classList.add('hidden');
        // 恢复背景滚动
        document.body.style.overflow = '';
    }
    
    markTutorialAsSeen() {
        this.hasSeenTutorial = true;
        localStorage.setItem('hasSeenTutorial', 'true');
    }
    
    // 重置教程（用于测试）
    resetTutorial() {
        this.hasSeenTutorial = false;
        localStorage.removeItem('hasSeenTutorial');
        this.showTutorial();
    }
}

// 初始化教程控制器
const tutorialController = new TutorialController();

// 调试功能：在控制台添加重置教程的方法
if (typeof window !== 'undefined') {
    window.resetTutorial = () => tutorialController.resetTutorial();
    console.log('💡 调试提示：在控制台输入 resetTutorial() 可以重新显示新手教程');
}

// DOM元素
const pages = {
    main: document.getElementById('main-page'),
    characterDetails: document.getElementById('character-details-page'),
    positions: document.getElementById('positions-page'),
    screeningResults: document.getElementById('screening-results-page'),
    interview: document.getElementById('interview-page'),
    interviewResults: document.getElementById('interview-results-page'),
    rejection: document.getElementById('rejection-page')
};


// 初始化游戏
function initGame() {
    showPage('main');
    setupEventListeners();
    // 首次进入渲染首页星级
    renderHomeStars();
}

// 设置事件监听器
function setupEventListeners() {
    // 角色选择
    document.querySelectorAll('.character-card').forEach(card => {
        card.addEventListener('click', () => selectCharacter(card.dataset.character));
    });

    // 记住信息按钮
    document.getElementById('memorize-btn').addEventListener('click', () => {
        showPositionsPage();
    });

    // 确认投递按钮
    document.getElementById('confirm-applications-btn').addEventListener('click', () => {
        showScreeningResultsPage();
    });

    // 进入面试按钮
    document.getElementById('enter-interview-btn').addEventListener('click', () => {
        console.log('进入面试按钮被点击');
        console.log('通过筛选的岗位:', game.passedPositions);
        startInterview();
    });

    // 重新开始按钮
    document.getElementById('restart-btn').addEventListener('click', () => {
        game.reset();
        showPage('main');
    });

    // 拒信页面重新开始按钮
    document.getElementById('rejection-restart-btn').addEventListener('click', () => {
        game.reset();
        showPage('main');
    });
}

// 选择角色
function selectCharacter(characterType) {
    game.currentCharacter = characterType;
    const character = characters[characterType];
    
    // 更新角色详情页面
    updateCharacterDetails(character);
    showPage('characterDetails');
}

// 更新角色详情
function updateCharacterDetails(character) {
    // 更新背景信息
    const backgroundList = document.getElementById('background-list');
    backgroundList.innerHTML = character.background.map(item => `<li>${item}</li>`).join('');

    // 更新角色立绘（详情页不显示角色图片，只显示背景图片）
    document.getElementById('character-illustration').innerHTML = '';

    // 根据角色切换详情页背景 role1~role4（webp/jpg/png 自动回退）
    const detailsPage = document.getElementById('character-details-page');
    const keyToIdx = { student: 1, experienced: 2, careerChanger: 3, entrepreneur: 4 };
    const idx = keyToIdx[game.currentCharacter] || 1;
    detailsPage.style.position = 'relative';
    detailsPage.style.overflow = 'hidden';
    detailsPage.style.background = 'none';
    detailsPage.style.minHeight = '100vh';
    detailsPage.style.width = '100%';
    detailsPage.style.padding = '40px 20px';
    detailsPage.style.setProperty('--role-bg', `url('role${idx}.png')`);
    // 用背景伪元素实现，避免内容遮挡
    if (!detailsPage.querySelector('.role-bg-layer')) {
        const layer = document.createElement('div');
        layer.className = 'role-bg-layer';
        layer.style.position = 'absolute';
        layer.style.inset = '0';
        layer.style.borderRadius = '0';
        layer.style.backgroundImage = `var(--role-bg)`;
        layer.style.backgroundSize = 'cover';
        layer.style.backgroundPosition = 'center';
        layer.style.zIndex = '0';
        detailsPage.prepend(layer);
        // 内容容器置顶
        const info = document.querySelector('#character-details-page .character-info');
        if (info) info.style.position = 'relative';
        if (info) info.style.zIndex = '1';
        // 加轻微暗层，提升可读性
        const dim = document.createElement('div');
        dim.className = 'role-bg-dim';
        dim.style.position = 'absolute';
        dim.style.inset = '0';
        dim.style.borderRadius = '15px';
        dim.style.background = 'rgba(0,0,0,0.28)';
        dim.style.zIndex = '0';
        detailsPage.prepend(dim);
    } else {
        const layer = detailsPage.querySelector('.role-bg-layer');
        if (layer) layer.style.backgroundImage = `var(--role-bg)`;
    }

    // 更新标签
    const tagsContainer = document.getElementById('tags-container');
    tagsContainer.innerHTML = character.tags.map(tag => {
        const isHighlighted = character.highlightedTags.includes(tag);
        return `<span class="tag ${isHighlighted ? 'highlighted' : ''}">${tag}</span>`;
    }).join('');

    // 更新求职意向
    const intentionsList = document.getElementById('intentions-list');
    intentionsList.innerHTML = character.intentions.map(item => `<li>${item}</li>`).join('');
}

// 显示职位页面
function showPositionsPage() {
    const character = characters[game.currentCharacter];
    const characterPositions = positions[game.currentCharacter];
    
    const positionsContainer = document.getElementById('positions-container');
    positionsContainer.innerHTML = characterPositions.map(position => `
        <div class="position-card" data-position-id="${position.id}">
            <div class="position-title">${position.title}</div>
            <div class="company-name">${position.company}</div>
            <div class="salary-range">薪资: ${position.salary}</div>
            <div class="position-details">
                <div class="detail-box">
                    <h4>岗位职责</h4>
                    <p>${position.responsibilities}</p>
                </div>
                <div class="detail-box">
                    <h4>岗位要求</h4>
                    <p>${position.requirements}</p>
                </div>
            </div>
        </div>
    `).join('');

    // 添加职位选择事件监听器
    document.querySelectorAll('.position-card').forEach(card => {
        card.addEventListener('click', () => selectPosition(card));
    });

    // 重置选择状态
    game.selectedPositions = [];
    game.remainingApplications = 2;
    updateSelectionInfo();

    showPage('positions');
}

// 选择职位
function selectPosition(card) {
    const positionId = parseInt(card.dataset.positionId);
    const character = characters[game.currentCharacter];
    const characterPositions = positions[game.currentCharacter];
    const position = characterPositions.find(p => p.id === positionId);

    if (game.selectedPositions.includes(positionId)) {
        // 取消选择
        game.selectedPositions = game.selectedPositions.filter(id => id !== positionId);
        card.classList.remove('selected');
    } else if (game.selectedPositions.length < 2) {
        // 选择职位
        game.selectedPositions.push(positionId);
        card.classList.add('selected');
    } else {
        alert('最多只能选择2个职位！');
        return;
    }

    updateSelectionInfo();
}

// 更新选择信息
function updateSelectionInfo() {
    document.getElementById('remaining-applications').textContent = 2 - game.selectedPositions.length;
    
    // 显示/隐藏确认按钮
    const confirmBtn = document.getElementById('confirm-applications-btn');
    if (confirmBtn) {
        confirmBtn.style.display = game.selectedPositions.length === 2 ? 'block' : 'none';
    }
}

// 显示筛选结果页面
function showScreeningResultsPage() {
    const character = characters[game.currentCharacter];
    const characterPositions = positions[game.currentCharacter];
    
    // 筛选通过的职位
    game.passedPositions = game.selectedPositions.filter(positionId => {
        const position = characterPositions.find(p => p.id === positionId);
        return position.matchScore >= 70;
    });
    
    const resultsList = document.getElementById('results-list');
    resultsList.innerHTML = game.selectedPositions.map(positionId => {
        const position = characterPositions.find(p => p.id === positionId);
        const passed = position.matchScore >= 70;
        
        return `
            <div class="result-item ${passed ? 'passed' : 'failed'}">
                <div class="result-info">
                    <div class="result-company">${position.company}</div>
                    <div class="result-position">${position.title}</div>
                </div>
                <div class="result-status ${passed ? 'passed' : 'failed'}">
                    ${passed ? '通过' : '未通过'}
                </div>
            </div>
        `;
    }).join('');

    if (game.passedPositions.length > 0) {
        document.getElementById('enter-interview-btn').style.display = 'block';
        // 更新按钮文本显示面试公司数量
        document.getElementById('enter-interview-btn').textContent = `进入面试 (${game.passedPositions.length}家公司)`;
    } else {
        // 没有通过的职位，显示拒信页面
        setTimeout(() => {
            const character = characters[game.currentCharacter];
            const failedPosition = game.selectedPositions.length > 0 ? 
                characterPositions.find(p => p.id === game.selectedPositions[0]) : 
                { company: '目标公司', title: '目标职位' };
            updateRejectionPage(failedPosition, character, 0, 'resume');
            showPage('rejection');
        }, 2000);
    }

    showPage('screeningResults');
}

// 开始面试
function startInterview() {
    console.log('startInterview 被调用');
    game.currentInterviewIndex = 0;
    game.currentQuestion = 0;
    game.correctAnswers = 0;
    game.isInterviewActive = true;
    
    // 开始第一家公司的面试
    startCompanyInterview();
}

// 开始特定公司的面试
function startCompanyInterview() {
    console.log('startCompanyInterview 被调用');
    console.log('当前面试索引:', game.currentInterviewIndex);
    console.log('通过筛选的岗位数量:', game.passedPositions.length);
    
    if (game.currentInterviewIndex >= game.passedPositions.length) {
        // 所有公司面试完成，显示最终结果
        console.log('所有公司面试完成');
        showFinalInterviewResults();
        return;
    }
    
    const currentPositionId = game.passedPositions[game.currentInterviewIndex];
    const characterPositions = positions[game.currentCharacter];
    const currentPosition = characterPositions.find(p => p.id === currentPositionId);
    
    console.log('当前面试岗位:', currentPosition);
    
    // 更新面试页面标题
    document.querySelector('.interviewer-name').textContent = `${currentPosition.company} 面试官`;
    document.querySelector('.interview-status').textContent = `正在面试中...`;
    
    game.currentQuestion = 0;
    game.correctAnswers = 0;
    game.isInterviewActive = true;
    
    showPage('interview');
    // 面试开始时，将好感度（星星）重置为0
    updateInterviewStars(0);
    
    // 延迟显示问题，确保页面已经切换
    setTimeout(() => {
        showQuestion();
    }, 100);
    
    // 清空聊天记录
    document.getElementById('chat-messages').innerHTML = '';
    
    // 添加欢迎消息
    addMessageToChat('你好，欢迎参加我们的面试。让我们开始吧！', 'interviewer');
}

// 随机打乱数组顺序
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// 添加消息到聊天记录
function addMessageToChat(message, sender) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const time = new Date().toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageDiv.innerHTML = `
        <div>${message}</div>
        <div class="message-time">${time}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    
    // 确保滚动到底部
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

// 显示问题
function showQuestion() {
    const character = characters[game.currentCharacter];
    
    // 根据当前面试的岗位选择对应的面试题
    const currentPositionId = game.passedPositions[game.currentInterviewIndex];
    const characterPositions = positions[game.currentCharacter];
    const currentPosition = characterPositions.find(p => p.id === currentPositionId);
    
    let questions;
    if (currentPosition && currentPosition.company === "创想文化传媒") {
        questions = interviewQuestions.student_media;
    } else if (currentPosition && currentPosition.company === "闪电出行") {
        questions = interviewQuestions.experienced_lightning;
    } else if (currentPosition && currentPosition.company === "智云互联") {
        if (game.currentCharacter === "entrepreneur") {
            questions = interviewQuestions.entrepreneur_zhihui;
        } else if (game.currentCharacter === "careerChanger") {
            questions = interviewQuestions.careerChanger_zhihui;
        } else {
            questions = interviewQuestions[game.currentCharacter];
        }
    } else {
        questions = interviewQuestions[game.currentCharacter];
    }
    
    const question = questions[game.currentQuestion];
    
    // 随机打乱选项顺序
    const shuffledOptions = shuffleArray(question.options);
    const correctAnswerIndex = shuffledOptions.findIndex(option => option === question.options[question.correct]);
    
    // 存储打乱后的正确答案索引
    game.currentCorrectAnswer = correctAnswerIndex;

    // 添加面试官消息到聊天记录
    addMessageToChat(question.question, 'interviewer');
    
    // 显示选项
    const answerOptions = document.getElementById('answer-options');
    answerOptions.innerHTML = shuffledOptions.map((option, index) => `
        <div class="answer-option" data-answer="${index}">
            ${option}
        </div>
    `).join('');

    // 添加答案选择事件监听器
    document.querySelectorAll('.answer-option').forEach(option => {
        option.addEventListener('click', () => selectAnswer(option));
    });

    // 开始倒计时
    startTimer();
}

// 选择答案
function selectAnswer(optionElement) {
    if (!game.isInterviewActive) return;

    const selectedAnswer = parseInt(optionElement.dataset.answer);
    const character = characters[game.currentCharacter];
    
    // 使用存储的正确答案索引
    const isCorrect = selectedAnswer === game.currentCorrectAnswer;

    // 停止计时器
    clearInterval(game.interviewTimer);
    game.isInterviewActive = false;

    // 添加候选人的回答到聊天记录
    const selectedText = optionElement.textContent.trim();
    addMessageToChat(selectedText, 'candidate');
    
    // 检查答案
    if (isCorrect) {
        game.correctAnswers++;
        optionElement.style.background = '#d4edda';
        optionElement.style.borderColor = '#28a745';
        // 实时更新面试好感度星级（门槛：答对3题点亮第1星）
        const realtimeStars = Math.min(Math.max(game.correctAnswers - 2, 0), 3);
        updateInterviewStars(realtimeStars);
    } else {
        optionElement.style.background = '#f8d7da';
        optionElement.style.borderColor = '#dc3545';
    }

    // 显示正确答案
    document.querySelectorAll('.answer-option').forEach((option, index) => {
        if (index === game.currentCorrectAnswer) {
            option.style.background = '#d4edda';
            option.style.borderColor = '#28a745';
        }
        option.style.pointerEvents = 'none';
    });

    // 延迟显示下一题或结果
    setTimeout(() => {
        game.currentQuestion++;
        if (game.currentQuestion < game.totalQuestions) {
            showQuestion();
        } else {
            showCompanyInterviewResults();
        }
    }, 2000);
}

// 开始计时器
function startTimer() {
    game.timeLeft = 30;
    game.isInterviewActive = true;
    
    const timerElement = document.getElementById('timer');
    const progressBar = document.getElementById('progress-bar');
    
    // 重置进度条
    progressBar.style.width = '100%';
    
    game.interviewTimer = setInterval(() => {
        game.timeLeft--;
        const progress = (game.timeLeft / 30) * 100;
        
        timerElement.textContent = `回答倒计时 ${game.timeLeft}S`;
        progressBar.style.width = `${progress}%`;
        
        // 根据剩余时间改变进度条颜色
        if (game.timeLeft <= 10) {
            progressBar.style.background = 'linear-gradient(90deg, #e53e3e, #c53030, #9c2626)';
        } else if (game.timeLeft <= 20) {
            progressBar.style.background = 'linear-gradient(90deg, #f6ad55, #ed8936, #dd6b20)';
        } else {
            progressBar.style.background = 'linear-gradient(90deg, #48bb78, #38a169, #2d7d32)';
        }
        
        if (game.timeLeft <= 0) {
            clearInterval(game.interviewTimer);
            game.isInterviewActive = false;
            // 时间到，自动选择错误答案
            setTimeout(() => {
                game.currentQuestion++;
                // 超时不加分，不更新星级
                if (game.currentQuestion < game.totalQuestions) {
                    showQuestion();
                } else {
                    showCompanyInterviewResults();
                }
            }, 1000);
        }
    }, 1000);
}

// 显示单家公司面试结果
function showCompanyInterviewResults() {
    const character = characters[game.currentCharacter];
    
    // 获取当前面试的公司信息
    const currentPositionId = game.passedPositions[game.currentInterviewIndex];
    const characterPositions = positions[game.currentCharacter];
    const currentPosition = characterPositions.find(p => p.id === currentPositionId);
    
    let questions;
    if (currentPosition && currentPosition.company === "创想文化传媒") {
        questions = interviewQuestions.student_media;
    } else if (currentPosition && currentPosition.company === "闪电出行") {
        questions = interviewQuestions.experienced_lightning;
    } else if (currentPosition && currentPosition.company === "智云互联") {
        if (game.currentCharacter === "entrepreneur") {
            questions = interviewQuestions.entrepreneur_zhihui;
        } else if (game.currentCharacter === "careerChanger") {
            questions = interviewQuestions.careerChanger_zhihui;
        } else {
            questions = interviewQuestions[game.currentCharacter];
        }
    } else {
        questions = interviewQuestions[game.currentCharacter];
    }
    
    let resultTitle = '';
    let starRating = 0;
    
    // 检查是否为风险岗位
    if (currentPosition.isFraud) {
        resultTitle = '园区欢迎你 🤡';
        starRating = 0; // 风险岗位固定0星
    } else {
        // 正常岗位按面试结果评分
        if (game.correctAnswers >= 5) {
            resultTitle = '上岸啦!!!';
            starRating = 3;
        } else if (game.correctAnswers >= 4) {
            resultTitle = '上岸啦!!!';
            starRating = 2;
        } else if (game.correctAnswers >= 3) {
            resultTitle = '上岸啦!!!';
            starRating = 1;
        } else {
            resultTitle = '很遗憾，面试未通过';
            starRating = 0;
        }
    }
    
    // 记录这家公司的面试结果
    if (!game.companyResults) {
        game.companyResults = [];
    }
    game.companyResults.push({
        positionId: currentPositionId,
        company: currentPosition.company,
        title: currentPosition.title,
        starRating: starRating,
        correctAnswers: game.correctAnswers
    });

    // 更新这家公司的好感度
    updateCompanyFavorability(game.currentCharacter, currentPositionId, starRating);

    // 根据面试结果显示不同页面
    if (starRating > 0) {
        // 面试成功，显示offer页面
        updateOfferPage(currentPosition, character, starRating, resultTitle);
        showPage('interviewResults');
    } else {
        // 面试失败，显示拒信页面
        updateRejectionPage(currentPosition, character, starRating, 'interview');
        showPage('rejection');
    }
    
    // 检查是否还有下一家公司需要面试
    game.currentInterviewIndex++;
    if (game.currentInterviewIndex < game.passedPositions.length) {
        // 还有下一家公司，显示继续按钮
        setTimeout(() => {
            const continueBtn = document.createElement('button');
            continueBtn.className = 'continue-btn';
            continueBtn.textContent = `继续下一家面试 (${game.passedPositions.length - game.currentInterviewIndex}家剩余)`;
            continueBtn.onclick = () => {
                continueBtn.remove();
                startCompanyInterview();
            };
            document.getElementById('interview-results-page').appendChild(continueBtn);
        }, 2000);
    } else {
        // 所有公司面试完成，显示最终结果
        setTimeout(() => {
            showFinalInterviewResults();
        }, 2000);
    }
}

// 更新Offer页面内容
function updateOfferPage(position, character, starRating, resultTitle) {
    // 更新候选人姓名
    document.getElementById('candidate-name').textContent = character.name;
    
    // 更新公司信息
    document.getElementById('offer-company').textContent = position.company;
    document.getElementById('offer-position').textContent = position.title;
    
    // 更新薪资信息
    let salaryText = '';
    if (starRating > 0) {
        // 按角色key计算基础薪资，避免改名影响逻辑
        const key = game.currentCharacter;
        const baseSalary = key === 'student' ? 10000 :
                           key === 'experienced' ? 25000 :
                           key === 'careerChanger' ? 8000 : 20000;
        const bonus = starRating * 2000;
        const totalSalary = baseSalary + bonus;
        salaryText = `${totalSalary}K/月 (基础${baseSalary}K + 表现奖金${bonus}K)`;
    } else {
        salaryText = '面试未通过';
    }
    document.getElementById('offer-salary').textContent = salaryText;
    
    // 更新面试评级
    const ratingText = starRating > 0 ? `${starRating}星 (答对${game.correctAnswers}/${game.totalQuestions}题)` : '未通过';
    document.getElementById('offer-rating').textContent = ratingText;
    
    // 更新日期
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    document.getElementById('offer-date').textContent = dateStr;
    document.getElementById('signature-date').textContent = dateStr;
    
    // 更新星星显示
    updateOfferStars(starRating);
    
    // 根据结果调整页面内容和动画效果
    const offerContainer = document.querySelector('.offer-container');
    if (starRating > 0) {
        // 面试成功的情况
        offerContainer.classList.add('success');
        
        // 添加庆祝效果
        setTimeout(() => {
            createConfetti();
        }, 1000);
        
        // 重置恭喜消息
        document.querySelector('.congratulations').textContent = '恭喜您通过我们的面试！';
        document.querySelector('.congratulations').style.color = '#48bb78';
        document.querySelector('.congratulations').style.background = 'linear-gradient(135deg, #f0fff4, #e6fffa)';
        document.querySelector('.congratulations').style.borderLeftColor = '#48bb78';
        
        document.querySelector('.offer-message').innerHTML = `
            <p>我们非常欣赏您在面试中展现的专业能力和个人素质。经过综合评估，我们决定向您发出这份录用通知。</p>
            <p>期待您的加入，与我们共同创造更美好的未来！</p>
        `;
    } else {
        // 面试未通过的情况
        offerContainer.classList.remove('success');
        
        // 检查是否为欺诈岗位
        if (position.isFraud) {
            document.querySelector('.congratulations').textContent = '园区欢迎你 🤡';
            document.querySelector('.congratulations').style.color = '#ff6b6b';
            document.querySelector('.congratulations').style.background = 'linear-gradient(135deg, #fff5f5, #fed7d7)';
            document.querySelector('.congratulations').style.borderLeftColor = '#ff6b6b';
            
            document.querySelector('.offer-message').innerHTML = `
                <p>恭喜您！您已经成功进入了我们的"特殊培训"项目。</p>
                <p>请准备好您的身份证、银行卡和所有积蓄，我们将在美丽的园区为您提供"全方位"的职业发展服务！</p>
                <p>⚠️ 温馨提示：这可能是诈骗，请谨慎！</p>
            `;
        } else {
            document.querySelector('.congratulations').textContent = '很遗憾，面试未通过';
            document.querySelector('.congratulations').style.color = '#e53e3e';
            document.querySelector('.congratulations').style.background = 'linear-gradient(135deg, #fff5f5, #fed7d7)';
            document.querySelector('.congratulations').style.borderLeftColor = '#e53e3e';
            
            document.querySelector('.offer-message').innerHTML = `
                <p>感谢您参加我们的面试，虽然这次未能通过，但我们相信您有很好的潜力。</p>
                <p>希望您继续努力，期待未来有机会与您合作！</p>
            `;
        }
    }
}

// 创建彩带庆祝效果
function createConfetti() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = '-10px';
            confetti.style.borderRadius = '50%';
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '9999';
            confetti.style.animation = `confetti ${2 + Math.random() * 3}s linear forwards`;
            
            document.body.appendChild(confetti);
            
            // 清理彩带
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 5000);
        }, i * 50);
    }
}

// 更新Offer页面的星星显示
function updateOfferStars(starsCount) {
    const stars = document.querySelectorAll('#stars-display .star');
    stars.forEach((star, index) => {
        if (index < starsCount) {
            star.style.color = '#ffd700';
            star.style.opacity = '1';
        } else {
            star.style.color = '#e2e8f0';
            star.style.opacity = '0.3';
        }
    });
}

// 更新拒信页面内容
function updateRejectionPage(position, character, starRating, rejectionType = 'interview') {
    // 更新候选人姓名
    document.getElementById('rejection-candidate-name').textContent = character.name;
    
    // 更新公司信息
    document.getElementById('rejection-company').textContent = position.company;
    document.getElementById('rejection-position').textContent = position.title;
    
    // 根据失败类型设置不同的内容
    if (rejectionType === 'resume') {
        // 简历筛选失败
        document.getElementById('rejection-logo').textContent = '📄';
        document.getElementById('rejection-main-title').textContent = 'RESUME NOTICE';
        document.getElementById('rejection-subtitle').textContent = '简历筛选结果';
        document.getElementById('rejection-message').textContent = '感谢您投递简历';
        document.getElementById('rejection-details-title').textContent = '简历信息';
        document.getElementById('rejection-result-label').textContent = '筛选结果：';
        document.getElementById('rejection-status').textContent = '未通过';
        
        // 隐藏答题情况行
        document.getElementById('rejection-score-row').style.display = 'none';
        
        // 设置简历筛选失败的措辞
        document.getElementById('rejection-message-content').innerHTML = `
            <p>感谢您对我们公司的关注和信任。经过简历筛选，很遗憾地通知您，本次未能进入面试环节。</p>
            <p>我们收到了很多优秀的简历，竞争非常激烈。虽然这次未能合作，但我们相信您有很好的潜力。</p>
            <p>建议您继续完善简历，突出相关经验，期待未来有机会与您合作！</p>
            <p>祝您求职顺利，前程似锦！</p>
        `;
    } else {
        // 面试失败
        document.getElementById('rejection-logo').textContent = '📧';
        document.getElementById('rejection-main-title').textContent = 'INTERVIEW NOTICE';
        document.getElementById('rejection-subtitle').textContent = '面试结果通知';
        document.getElementById('rejection-message').textContent = '感谢您参加我们的面试';
        document.getElementById('rejection-details-title').textContent = '面试信息';
        document.getElementById('rejection-result-label').textContent = '面试结果：';
        document.getElementById('rejection-status').textContent = '未通过';
        
        // 显示答题情况行
        document.getElementById('rejection-score-row').style.display = 'flex';
        const scoreText = `答对${game.correctAnswers}/${game.totalQuestions}题`;
        document.getElementById('rejection-score').textContent = scoreText;
        
        // 设置面试失败的措辞
        document.getElementById('rejection-message-content').innerHTML = `
            <p>感谢您对我们公司的关注和信任。经过面试评估，很遗憾地通知您，本次面试未能通过。</p>
            <p>虽然这次未能合作，但我们相信您有很好的潜力。建议您继续提升专业技能，期待未来有机会与您合作！</p>
            <p>祝您求职顺利，前程似锦！</p>
        `;
    }
    
    // 更新日期
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    document.getElementById('rejection-date').textContent = dateStr;
    document.getElementById('rejection-signature-date').textContent = dateStr;
}

// 显示最终面试结果
function showFinalInterviewResults() {
    const character = characters[game.currentCharacter];
    
    // 计算总结果
    const totalCompanies = game.companyResults.length;
    const successfulCompanies = game.companyResults.filter(result => result.starRating > 0);
    
    // 找到最佳offer（星级最高的）
    const bestOffer = successfulCompanies.length > 0 ? 
        successfulCompanies.reduce((best, current) => 
            current.starRating > best.starRating ? current : best
        ) : null;
    
    if (bestOffer) {
        // 显示最佳offer
        updateOfferPage(bestOffer, character, bestOffer.starRating, '恭喜获得offer！');
        
        // 如果有多个offer，在底部显示其他offer信息
        if (successfulCompanies.length > 1) {
            const otherOffers = successfulCompanies.filter(result => result !== bestOffer);
            const otherOffersHtml = otherOffers.map(result => {
                const stars = '★'.repeat(result.starRating) + '☆'.repeat(3 - result.starRating);
                return `<p><strong>${result.company}</strong> - ${result.title} (${stars})</p>`;
            }).join('');
            
            // 在offer消息后添加其他offer信息
            const offerMessage = document.querySelector('.offer-message');
            offerMessage.innerHTML += `
                <div style="margin-top: 20px; padding: 15px; background: #f0f8ff; border-radius: 10px; border-left: 4px solid #667eea;">
                    <h4 style="margin: 0 0 10px 0; color: #2d3748;">其他获得的offer：</h4>
                    ${otherOffersHtml}
                </div>
            `;
        }
    } else {
        // 所有面试都未通过，显示拒信页面
        const failedPosition = game.companyResults[0]; // 使用第一个公司作为示例
        updateRejectionPage(failedPosition, character, 0, 'interview');
        showPage('rejection');
        return; // 直接返回，不执行后面的showPage('interviewResults')
    }

    showPage('interviewResults');
    
    // 返回首页时刷新星级展示
    setTimeout(() => {
        renderHomeStars();
    }, 0);
}

// 根据给定星级，更新面试页的星星显示
function updateInterviewStars(starsCount) {
    const stars = document.querySelectorAll('#interview-stars .star');
    stars.forEach((star, index) => {
        star.style.color = index < starsCount ? '#ffd700' : '#e2e8f0';
    });
}

// 显示页面
function showPage(pageName) {
    // 隐藏所有页面
    Object.values(pages).forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });
    
    // 显示目标页面
    if (pages[pageName]) {
        pages[pageName].classList.add('active');
        pages[pageName].style.display = 'block';
    } else {
        console.error('Page not found:', pageName);
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', initGame);
