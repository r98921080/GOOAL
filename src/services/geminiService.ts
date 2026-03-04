import { GoogleGenAI, Type } from "@google/genai";
import { DailyLog, Category, DailyChallenge, FunFact, TodoItem, DailyAnalysis, AppState, ExploreAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function performDeepLifeAnalysis(state: AppState): Promise<ExploreAnalysis> {
  if (!process.env.GEMINI_API_KEY) {
    return {
      emotions: "請設定 API Key 以啟用分析。",
      psychology: "請設定 API Key 以啟用分析。",
      balance: "請設定 API Key 以啟用分析。",
      advice: "請設定 API Key 以啟用分析。",
      goalAdjustments: "請設定 API Key 以啟用分析。",
      updatedAt: new Date().toISOString()
    };
  }

  const prompt = `
    你是一位全方位的生命教練與心理學家。請根據使用者的所有數據，進行深度的人格與生活狀態分析。
    
    數據：
    - 類別：${JSON.stringify(state.categories.map(c => c.title))}
    - 最近紀錄：${JSON.stringify(state.logs)}
    - 最近日誌：${JSON.stringify(state.dailyNotes)}
    - 成就：${JSON.stringify(state.profile.achievements)}
    
    請分析：
    1. 使用者的情緒與心理狀態（察覺潛在壓力或動力）。
    2. 生活與工作的平衡狀況。
    3. 給予 3 個具體建議，讓使用者離目標更近或成為更好的人。
    4. 洞見觀察：目標是否需要微調？是否有過於激進或保守的地方？
    
    請以 JSON 格式回傳。
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
            emotions: { type: Type.STRING },
            psychology: { type: Type.STRING },
            balance: { type: Type.STRING },
            advice: { type: Type.STRING },
            goalAdjustments: { type: Type.STRING }
          },
          required: ["emotions", "psychology", "balance", "advice", "goalAdjustments"]
        }
      }
    });
    const data = JSON.parse(response.text || "{}");
    return {
      ...data,
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Deep Life Analysis Error:", error);
    return {
      emotions: "分析失敗",
      psychology: "分析失敗",
      balance: "分析失敗",
      advice: "分析失敗",
      goalAdjustments: "分析失敗",
      updatedAt: new Date().toISOString()
    };
  }
}

export async function pickMusic(theme: string): Promise<{ url: string; title: string }> {
  // In a real app, this would query a music API or a curated list.
  // For this demo, we'll provide some high-quality royalty-free links.
  const musicMap: Record<string, { url: string; title: string }[]> = {
    focus: [
      { url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", title: "專注冥想曲 1" },
      { url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", title: "深層工作流" }
    ],
    relax: [
      { url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", title: "午後寧靜" },
      { url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", title: "星空下的放鬆" }
    ],
    energy: [
      { url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", title: "活力晨間" },
      { url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3", title: "極限突破" }
    ],
    ambient: [
      { url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", title: "環境氛圍 1" },
      { url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3", title: "自然之聲" }
    ]
  };

  const tracks = musicMap[theme] || musicMap.focus;
  return tracks[Math.floor(Math.random() * tracks.length)];
}

export interface AIJournalAnalysis {
  calendarEvents: {
    summary: string;
    location: string;
    description: string;
    start: string;
    end: string;
  }[];
  todos: string[];
}

export async function analyzeJournal(text: string): Promise<AIJournalAnalysis> {
  if (!process.env.GEMINI_API_KEY || !text.trim()) return { calendarEvents: [], todos: [] };

  const prompt = `
    你是一位貼心的個人助理。請閱讀以下使用者的日誌內容，並提取出：
    1. 可能需要建立在 Google 日曆上的行程或約會（包含主題、地點、描述、開始時間、結束時間）。
       - 時間格式請使用 ISO 8601 (例如: 2026-03-01T10:00:00)。
       - 如果日誌中沒有明確時間，請根據上下文推測或給予合理的預設值（例如隔天上午 10 點）。
    2. 可能需要做的待辦事項（以簡短關鍵字表示）。

    日誌內容：
    "${text}"

    請以 JSON 格式回傳。
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
            calendarEvents: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  summary: { type: Type.STRING },
                  location: { type: Type.STRING },
                  description: { type: Type.STRING },
                  start: { type: Type.STRING },
                  end: { type: Type.STRING }
                },
                required: ["summary", "location", "description", "start", "end"]
              }
            },
            todos: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["calendarEvents", "todos"]
        }
      }
    });
    return JSON.parse(response.text || '{"calendarEvents": [], "todos": []}');
  } catch (error) {
    console.error("Analyze Journal Error:", error);
    return { calendarEvents: [], todos: [] };
  }
}

export async function generateDailyAnalysis(logs: DailyLog, note: string): Promise<DailyAnalysis> {
  if (!process.env.GEMINI_API_KEY) return { summary: "", mindMap: "" };

  const prompt = `
    你是一位心理分析師與成長教練。請根據使用者今日的完成紀錄與日誌，進行深度分析。
    
    今日紀錄：${JSON.stringify(logs)}
    今日日誌：${note}
    
    任務：
    1. 總結今日的中心思想與狀況（約 100 字）。
    2. 建立一個心智圖結構，包含中心主題、主要分支與子分支。
    
    請以 JSON 格式回傳，心智圖請使用簡單的層級結構。
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
            summary: { type: Type.STRING },
            mindMap: { type: Type.STRING, description: "心智圖的文字描述或結構化字串" }
          },
          required: ["summary", "mindMap"]
        }
      }
    });
    return JSON.parse(response.text || '{"summary": "", "mindMap": ""}');
  } catch (error) {
    console.error("Daily Analysis Error:", error);
    return { summary: "", mindMap: "" };
  }
}

export async function getFunFacts(existingFacts: string[] = []): Promise<FunFact[]> {
  if (!process.env.GEMINI_API_KEY) return [];

  const prompt = `
    請提供 3 個有趣的小知識。
    主題可以是氣象、心理、生物、化學、天文、歷史等。
    每個知識點要有趣、令人驚訝，且簡短（50字以內）。
    
    目前已有的知識點（請不要重複）：
    ${existingFacts.join('\n')}
    
    請回傳 3 個全新的知識點。
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
