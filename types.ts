
export type Language = 'zh' | 'en';

export interface AccountInfo {
  id: string;
  provider: 'google' | 'guest';
  email?: string;
  avatarUrl?: string;
}

export interface UserProfile {
  dueDate: string; // ISO Date string YYYY-MM-DD
  name: string;
  language: Language;
  timezone: string;
  account?: AccountInfo; // Optional, if undefined treated as legacy/guest
}

export type CountMethod = '1h' | '2h';

export interface KickSession {
  id: string;
  startTime: number; // Timestamp
  endTime: number; // Timestamp
  durationSeconds: number;
  count: number; // This is the "Valid/Effective" count
  rawCount: number; // This is the total number of taps
  method: CountMethod;
  weekOfPregnancy: number;
  anomalyStatus?: 'low' | 'medium' | 'high' | 'none';
  anomalyReason?: string;
}

export interface WeeklyInsight {
  week: number;
  momSymptoms: string;
  babyDevelopment: string;
  medicalAdvice: string;
  nutrition: string;
  shopping: string;
}

export interface AnomalyAnalysis {
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high' | 'none';
  message: string;
  medicalContext: string;
}

export enum TabView {
  DASHBOARD = 'dashboard',
  COUNTER = 'counter',
  TRENDS = 'trends',
  GUIDE = 'guide',
  PROFILE = 'profile'
}

export const TIMEZONES = [
  { value: 'Asia/Shanghai', label: 'China (Beijing Time)' },
  { value: 'America/Los_Angeles', label: 'USA (Pacific Time)' },
  { value: 'America/New_York', label: 'USA (Eastern Time)' },
  { value: 'Europe/London', label: 'UK (London)' },
  { value: 'Asia/Tokyo', label: 'Japan (Tokyo)' },
  { value: 'Australia/Sydney', label: 'Australia (Sydney)' },
];

// Helper to parse "YYYY-MM-DD" string into a Local Date object at 00:00:00
export const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const TRANSLATIONS = {
  en: {
    welcome: "Welcome to BabyKicks",
    setupProfile: "Track your baby's movements accurately.",
    nameLabel: "Your Name (or Baby's Nickname)",
    namePlaceholder: "e.g. Mommy or Peanut",
    dateLabel: "Due Date",
    timezoneLabel: "Timezone",
    startTracking: "Start Tracking",
    currentProgress: "Current Progress",
    weeks: "Weeks",
    days: "Days",
    daysToGo: "days to go",
    distanceToDue: "Distance to due date:",
    due: "Due Date",
    kicksToday: "Effective",
    sessionsToday: "Sessions",
    timeToCount: "Time to Count?",
    countAdvice: "Medical advice suggests counting once a day, or whenever you notice a change in movement.",
    startCounter: "Start Kick Counter",
    countingActive: "Counting Active...",
    tapToRecord: "Tap to Record Kick",
    viewResults: "View Results",
    todaysRecords: "Today's Records",
    recentSessions: "History",
    movements: "movements",
    sessionComplete: "Session Complete",
    discard: "Discard",
    saveRecord: "Save Record",
    selectMethod: "Select Method",
    standardCount: "Standard (1h)",
    extendedCheck: "Extended (2h)",
    tapToCount: "Tap to Count",
    finishSession: "Finish Session",
    validKicks: "Effective",
    rawKicks: "Total Taps",
    trends: "Trends",
    guide: "Weekly Guide",
    home: "Home",
    count: "Count",
    viewMore: "View More",
    mom: "Mom's Body",
    baby: "Baby's Growth",
    medical: "Medical Checkups",
    nutrition: "Nutrition",
    shopping: "Preparation & Shopping",
    loadingAdvice: "Loading expert insights...",
    attention: "Attention",
    me: "Me",
    profileSettings: "Profile Settings",
    saveChanges: "Save Changes",
    language: "Language",
    saved: "Saved!",
    remaining: "Remaining",
    aiDisclaimer: "AI-generated insights for reference only. Consult a doctor for medical advice.",
    dataChangeWarning: "Note: Changing timezone or due date will affect historical data display.",
    anomalyReason: "Reason:",
    advice: "Advice:",
    aiPatternSummary: "AI Pattern Summary",
    activeHours: "Active Hours Distribution",
    disclaimer: "Disclaimer",
    notEnoughData: "Not enough data yet. Please record for a few more days to generate pattern analysis.",
    all: "All",
    w1: "1 Week",
    w3: "3 Weeks",
    w7: "7 Weeks",
    signInGoogle: "Sign in with Google",
    guestMode: "Continue as Guest",
    loginDesc: "Sign in to sync your data across devices and keep it safe.",
    guestDesc: "No account needed. Data is saved on this device only.",
    account: "Account",
    notLoggedIn: "Not Logged In",
    guestBadge: "Guest User",
    syncNow: "Sign in to Sync",
    logout: "Log Out",
    loggingIn: "Signing in...",
  },
  zh: {
    welcome: "欢迎使用胎动计数器",
    setupProfile: "记录宝宝胎动，守护每一刻。",
    nameLabel: "您的昵称 (或宝宝的小名)",
    namePlaceholder: "例如：准妈妈 或 小花生",
    dateLabel: "预产期",
    timezoneLabel: "所在地区",
    startTracking: "开始追踪",
    currentProgress: "当前孕周",
    weeks: "周",
    days: "天",
    daysToGo: "天后预产",
    distanceToDue: "距离预产期",
    due: "预产期",
    kicksToday: "今日有效",
    sessionsToday: "今日次数",
    timeToCount: "该数胎动了吗？",
    countAdvice: "建议每天固定时间数一次，或在感觉异常时监测。",
    startCounter: "开始数胎动",
    countingActive: "正在计数中...",
    tapToRecord: "点击记录一次",
    viewResults: "查看结果",
    todaysRecords: "今日记录",
    recentSessions: "历史记录",
    movements: "次有效",
    sessionComplete: "本次计数结束",
    discard: "放弃",
    saveRecord: "保存记录",
    selectMethod: "选择模式",
    standardCount: "标准计数 (1小时)",
    extendedCheck: "延长观察 (2小时)",
    tapToCount: "点击记录",
    finishSession: "结束计数",
    validKicks: "有效胎动",
    rawKicks: "实际点击",
    trends: "胎动趋势",
    guide: "孕周指南",
    home: "首页",
    count: "计数",
    viewMore: "查看详情",
    mom: "宝妈变化",
    baby: "宝宝发育",
    medical: "医疗建议",
    nutrition: "营养重点",
    shopping: "好物/待产",
    loadingAdvice: "正在生成本周建议...",
    attention: "异常注意",
    me: "我的",
    profileSettings: "个人设置",
    saveChanges: "保存修改",
    language: "语言",
    saved: "已保存!",
    remaining: "剩余时间",
    aiDisclaimer: "AI生成内容仅供参考，不可替代医疗诊断。如有不适请及时就医。",
    dataChangeWarning: "注意：修改时区或预产期会影响历史数据的显示与判定。",
    anomalyReason: "判定原因：",
    advice: "建议：",
    aiPatternSummary: "AI 模式总结",
    activeHours: "活跃时段分布",
    disclaimer: "免责声明",
    notEnoughData: "数据不足，请多记录几天以生成模式分析。",
    all: "全部",
    w1: "近1周",
    w3: "近3周",
    w7: "近7周",
    signInGoogle: "使用 Google 账号登陆",
    guestMode: "游客模式使用",
    loginDesc: "登陆后可同步数据，防止数据丢失。",
    guestDesc: "无需注册，数据仅保存在当前设备。",
    account: "账号管理",
    notLoggedIn: "未登录",
    guestBadge: "游客身份",
    syncNow: "点击登陆以同步数据",
    logout: "退出登陆",
    loggingIn: "正在登陆...",
  }
};
