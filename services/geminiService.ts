import { GoogleGenAI, Type } from "@google/genai";
import { AnomalyAnalysis, KickSession, WeeklyInsight, Language } from "../types";

const apiKey = process.env.API_KEY;
// Safe initialization - if no key, we handle gracefully in UI
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const getWeeklyInsight = async (week: number, lang: Language, timezone: string): Promise<WeeklyInsight> => {
  if (!ai) {
    return {
      week,
      momSymptoms: lang === 'zh' ? "请配置API Key以获取建议" : "API Key missing.",
      babyDevelopment: "N/A",
      medicalAdvice: "N/A",
      nutrition: "N/A",
      shopping: "N/A"
    };
  }

  const prompt = `
    I am currently in week ${week} of pregnancy.
    Location/Timezone: ${timezone}. 
    Language: ${lang === 'zh' ? 'Simplified Chinese (zh-CN)' : 'English'}.
    
    Provide a JSON response with 5 specific categories.
    
    IMPORTANT FORMATTING RULES:
    1. Use a Numbered List for content (e.g., "1. First point\\n2. Second point").
    2. STRICTLY use the escaped newline sequence '\\n' for line breaks within the JSON strings. Do NOT use literal line breaks.
    3. Keep descriptions concise (max 3-4 points per category) to ensure the JSON response is not truncated.
    
    For "medicalAdvice", provide specific advice based on the location's medical system (e.g., if in US/California, mention RSV or Tdap if relevant for this week; if in China, mention specific screenings like NT or Sugar tolerance if relevant).
    For "shopping", suggest items relevant to the gestational stage (e.g., hospital bag items, stretch mark cream).
    
    Schema:
    {
      "momSymptoms": "Physiological changes for mom (numbered list with \\n)",
      "babyDevelopment": "Organ and brain development updates (numbered list with \\n)",
      "medicalAdvice": "Checkups and vaccines based on location (numbered list with \\n)",
      "nutrition": "Dietary focus for this week (numbered list with \\n)",
      "shopping": "Recommended purchases (numbered list with \\n)"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            momSymptoms: { type: Type.STRING },
            babyDevelopment: { type: Type.STRING },
            medicalAdvice: { type: Type.STRING },
            nutrition: { type: Type.STRING },
            shopping: { type: Type.STRING },
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    const data = JSON.parse(text);
    return {
      week,
      ...data
    };

  } catch (error) {
    console.error("Error fetching weekly insight:", error);
    return {
      week,
      momSymptoms: lang === 'zh' ? "无法加载数据 (请重试)" : "Could not load data.",
      babyDevelopment: lang === 'zh' ? "保持轻松心情" : "Stay relaxed.",
      medicalAdvice: lang === 'zh' ? "请咨询医生" : "Consult your doctor.",
      nutrition: lang === 'zh' ? "均衡饮食" : "Balanced diet.",
      shopping: ""
    };
  }
};

export const analyzeKickAnomaly = async (
  currentSession: KickSession,
  history: KickSession[],
  lang: Language
): Promise<AnomalyAnalysis> => {
  const disclaimer = lang === 'zh' ? " (AI分析结果仅供参考)" : " (AI Result - For Reference Only)";

  if (!ai) {
    // Fallback logic if no AI
    const isLow = currentSession.count < 3 && currentSession.durationSeconds > 3600;
    return {
      isAnomaly: isLow,
      severity: isLow ? 'medium' : 'none',
      message: isLow 
        ? (lang === 'zh' ? "胎动次数偏少" : "Movement seems lower than standard.") + disclaimer
        : (lang === 'zh' ? "胎动正常" : "Movement looks normal."),
      medicalContext: lang === 'zh' ? "医学建议2小时内有效胎动应大于10次，或1小时大于3次。" : "Standard advice is 10 kicks in 2 hours."
    };
  }

  // Filter history to comparable sessions (same time of day +/- 3 hours)
  const hourOfDay = new Date(currentSession.startTime).getHours();
  const relevantHistory = history.filter(h => {
     const hHour = new Date(h.startTime).getHours();
     return Math.abs(hHour - hourOfDay) <= 3;
  }).slice(-10);
  
  const avgKicks = relevantHistory.length > 0 
    ? relevantHistory.reduce((acc, cur) => acc + cur.count, 0) / relevantHistory.length 
    : 0;

  const prompt = `
    Analyze fetal movement session.
    Language: ${lang === 'zh' ? 'Simplified Chinese (zh-CN)' : 'English'}.
    
    Context:
    - Gestational Week: ${currentSession.weekOfPregnancy}
    - Method: ${currentSession.method}
    - Valid Count: ${currentSession.count}
    - Raw Taps: ${currentSession.rawCount}
    - Duration: ${Math.floor(currentSession.durationSeconds / 60)} min
    
    History Context:
    - User usually averages ${avgKicks.toFixed(1)} valid kicks during this time of day (${hourOfDay}:00).
    
    Task: Determine if this is an anomaly.
    - Compare against Medical Standard (10 in 2h, or >3 in 1h).
    - Compare against Personal History (is it < 50% of their normal?).
    
    Response JSON:
    {
      "isAnomaly": boolean,
      "severity": "low" | "medium" | "high" | "none",
      "message": "Reason for anomaly status. Explain WHY (e.g., 'Count is 50% lower than your average'). Add a suggestion.",
      "medicalContext": "General medical guideline context."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isAnomaly: { type: Type.BOOLEAN },
            severity: { type: Type.STRING, enum: ['low', 'medium', 'high', 'none'] },
            message: { type: Type.STRING },
            medicalContext: { type: Type.STRING }
          }
        }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("Empty response");
    const result = JSON.parse(text) as AnomalyAnalysis;
    
    // Append disclaimer to message
    result.message = result.message + disclaimer;
    
    return result;

  } catch (e) {
    console.error(e);
    return {
      isAnomaly: false,
      severity: 'none',
      message: (lang === 'zh' ? "记录已保存" : "Session recorded.") + disclaimer,
      medicalContext: ""
    };
  }
};
