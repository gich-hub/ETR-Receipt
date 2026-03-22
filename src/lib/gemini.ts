import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client
// Note: We use the environment variable for the API key.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface OCRResult {
  merchantName?: string;
  date?: string;
  totalAmount?: number;
  currency?: string;
  category?: string;
}

export async function analyzeReceipt(imageBlob: Blob): Promise<OCRResult> {
  try {
    // Convert Blob to Base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageBlob);
    });

    const model = "gemini-2.5-flash-image"; // Optimized for speed and images
    const prompt = `
      Analyze this receipt image. Extract the following information:
      - Merchant Name (or activity name if unclear)
      - Date (YYYY-MM-DD format)
      - Total Amount (number only)
      - Currency (symbol or code, e.g., USD, EUR, £)
      - Category (e.g., Meals, Transport, Lodging, Supplies, Entertainment)

      Return ONLY a JSON object with these keys: merchantName, date, totalAmount, currency, category.
      Do not include markdown formatting or code blocks.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: imageBlob.type, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    try {
      const data = JSON.parse(text);
      return {
        merchantName: data.merchantName,
        date: data.date,
        totalAmount: typeof data.totalAmount === 'string' ? parseFloat(data.totalAmount.replace(/[^0-9.]/g, '')) : data.totalAmount,
        currency: data.currency,
        category: data.category
      };
    } catch (e) {
      console.error("Failed to parse JSON:", text);
      return {};
    }

  } catch (error) {
    console.error("OCR Error:", error);
    throw error;
  }
}
