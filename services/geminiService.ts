
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || "";

export const getGeminiResponse = async (prompt: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) => {
  if (!API_KEY) return "AI Service currently unavailable.";
  
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const model = 'gemini-3-flash-preview';
    
    const response = await ai.models.generateContent({
      model,
      contents: [
        ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.parts[0].text }] })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: "You are an AI contact in a messaging app. Be brief, friendly, and helpful. Use emojis occasionally.",
        temperature: 0.7,
        topP: 0.8,
      }
    });

    return response.text || "I'm not sure how to respond to that.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sorry, I had a bit of a brain freeze. Try again?";
  }
};
