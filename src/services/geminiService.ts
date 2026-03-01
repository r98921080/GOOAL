import { GoogleGenAI, Type } from "@google/genai";
import { DailyLog, Category, DailyChallenge, FunFact } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getFunFacts(): Promise<FunFact[]> {
  if (!process.env.GEMINI_API_KEY) return [];

  const prompt = `
    請提供 3 個有趣的小知識。
    主題可以是氣象、心理、生物、化學、天文、歷史等。
    每個知識點要有趣、令人驚訝，且簡短（50字以內）。
    格式範例：
    - "人類的小腸有 6 公尺長，大約是大腸長度的 4 倍。"
    
    請回傳 3 個知識點。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["content", "category"]
          }
        }
      }
    });
    const data = JSON.parse(response.text || "[]");
    return data.map((d: any) => ({
      ...d,
      id: `fact_${Math.random().toString(36).substr(2, 9)}`
    }));
  } catch (error) {
    console.error("Fun Facts Error:", error);
    return [];
  }
}

export async function generateWeeklySummary(logs: { [date: string]: DailyLog }, categories: Category[]) {
  if (!process.env.GEMINI_API_KEY) return "請設定 API Key 以啟用 AI 摘要功能。";

  const prompt = `
    你是一位資深的成長教練。以下是使用者本週的習慣追蹤數據：
    
    類別結構：${JSON.stringify(categories.map(c => ({ title: c.title, items: c.subItems.map(s => s.name) })))}
    
    紀錄數據：${JSON.stringify(logs)}
    
    請根據以上數據，提供一個極簡短（80字以內）的本週總結。
    格式：
    - 亮點：[一句話]
    - 建議：[一句話]
    - 鼓勵：[一句話]
    
    請使用繁體中文，語氣精煉。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "無法生成摘要。";
  } catch (error) {
    console.error("AI Summary Error:", error);
    return "生成摘要時發生錯誤。";
  }
}

export async function getDailyChallenges(logs: { [date: string]: DailyLog }, categories: Category[], notes: { [date: string]: string }): Promise<DailyChallenge[]> {
  if (!process.env.GEMINI_API_KEY) return [];

  const prompt = `
    你是一位成長教練。根據使用者的習慣數據和日誌筆記，生成 3 個今日小挑戰。
    類別：${JSON.stringify(categories.map(c => c.title))}
    日誌筆記：${JSON.stringify(notes)}
    最近紀錄：${JSON.stringify(logs)}
    
    挑戰應具備：
    1. 具體可執行的動作。
    2. 針對使用者的弱點或日誌中提到的問題（如社交焦慮、動力不足、完成度低）。
    3. 每個挑戰完成後給予 20-50 積分。
    
    請回傳 3 個挑戰。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              points: { type: Type.NUMBER },
              type: { type: Type.STRING }
            },
            required: ["title", "description", "points", "type"]
          }
        }
      }
    });
    const data = JSON.parse(response.text || "[]");
    return data.map((d: any) => ({
      ...d,
      id: `challenge_${Math.random().toString(36).substr(2, 9)}`,
      completed: false
    }));
  } catch (error) {
    console.error("Daily Challenges Error:", error);
    return [];
  }
}

export async function getSubItemSuggestions(categoryTitle: string, existingSubItems: string[]): Promise<string[]> {
  if (!process.env.GEMINI_API_KEY) return ["建議項目 1", "建議項目 2", "建議項目 3"];

  const prompt = `
    使用者正在建立一個名為「${categoryTitle}」的大項目。
    目前已有的子項目：${existingSubItems.join(', ')}
    
    請根據「${categoryTitle}」的主題，並參考已有的子項目，提供 3 個互補或進階的子項目建議。
    
    請回傳 3 個簡短的項目名稱。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("SubItem Suggestions Error:", error);
    return ["建議項目 1", "建議項目 2", "建議項目 3"];
  }
}

export async function getSubItemGoals(categoryTitle: string, subItemName: string): Promise<{ mini: string; advanced: string; elite: string }> {
  if (!process.env.GEMINI_API_KEY) return { mini: '低保', advanced: '進階', elite: '菁英' };

  const prompt = `
    大項目：「${categoryTitle}」
    子項目：「${subItemName}」
    
    請為這個子項目訂定三個等級的目標：
    1. mini (低保)：最容易達成、不費力的門檻。
    2. advanced (進階)：需要一定努力的目標。
    3. elite (菁英)：具有挑戰性、高成就感的目標。
    
    請回傳這三個等級的具體描述（10字以內）。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mini: { type: Type.STRING },
            advanced: { type: Type.STRING },
            elite: { type: Type.STRING }
          },
          required: ["mini", "advanced", "elite"]
        }
      }
    });
    return JSON.parse(response.text || '{"mini": "低保", "advanced": "進階", "elite": "菁英"}');
  } catch (error) {
    console.error("SubItem Goals Error:", error);
    return { mini: '低保', advanced: '進階', elite: '菁英' };
  }
}
export function parseNLPSetup(input: string): Partial<Category> | null {
  // Simple regex-based parser for "Category: item1, item2, item3"
  const match = input.match(/^(.+?)[:：]\s*(.+?)[,，]\s*(.+?)[,，]\s*(.+)$/);
  if (!match) return null;

  return {
    title: match[1].trim(),
    subItems: [
      { id: Math.random().toString(36).substr(2, 9), name: match[2].trim(), levels: { mini: '低保', advanced: '進階', elite: '菁英' } },
      { id: Math.random().toString(36).substr(2, 9), name: match[3].trim(), levels: { mini: '低保', advanced: '進階', elite: '菁英' } },
      { id: Math.random().toString(36).substr(2, 9), name: match[4].trim(), levels: { mini: '低保', advanced: '進階', elite: '菁英' } },
    ]
  } as Category;
}
