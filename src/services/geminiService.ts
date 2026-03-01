import { GoogleGenAI } from "@google/genai";
import { DailyLog, Category } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateWeeklySummary(logs: { [date: string]: DailyLog }, categories: Category[]) {
  if (!process.env.GEMINI_API_KEY) return "請設定 API Key 以啟用 AI 摘要功能。";

  const prompt = `
    你是一位資深的成長教練。以下是使用者本週的習慣追蹤數據：
    
    類別結構：${JSON.stringify(categories.map(c => ({ title: c.title, items: c.subItems.map(s => s.name) })))}
    
    紀錄數據：${JSON.stringify(logs)}
    
    請根據以上數據，提供一個簡短（150字以內）的本週總結。
    包含：
    1. 表現最出色的領域。
    2. 需要改進的建議。
    3. 一句鼓勵的話。
    
    請使用繁體中文，語氣專業且富有激勵性。
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
