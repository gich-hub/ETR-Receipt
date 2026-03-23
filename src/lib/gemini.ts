import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini API client
// Note: We use the environment variable for the API key.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface OCRResult {
  merchantName?: string;
  merchantKraPin?: string;
  date?: string;
  totalTaxableAmount?: number;
  totalTax?: number;
  totalAmount?: number;
  currency?: string;
  category?: string;
  buyerName?: string;
  buyerPin?: string;
  scuSignature?: string;
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

    const model = "gemini-3-flash-preview"; 
    const prompt = `
      Analyze this receipt image. Extract the following information:
      - Merchant Name (or activity name if unclear)
      - Merchant KRA PIN (usually starts with P or A followed by numbers and a letter)
      - Date (YYYY-MM-DD format)
      - Total Taxable Amount (number only)
      - Total Tax (number only)
      - Total Amount (number only)
      - Currency (symbol or code, e.g., USD, EUR, KES)
      - Category (e.g., Meals, Transport, Lodging, Supplies, Entertainment)
      - Buyer Name (by default the receipt should contain the buyer name, extract it if present)
      - Buyer PIN (by default the receipt should contain the buyer PIN, extract it if present)
      - SCU Signature (usually a long alphanumeric string or hash at the bottom)

      Return a JSON object with these keys: merchantName, merchantKraPin, date, totalTaxableAmount, totalTax, totalAmount, currency, category, buyerName, buyerPin, scuSignature.
      If a value is not found, omit the key or return null.
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
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchantName: { type: Type.STRING, description: "The name of the merchant" },
            merchantKraPin: { type: Type.STRING, description: "The KRA PIN of the merchant" },
            date: { type: Type.STRING, description: "The date of the receipt in YYYY-MM-DD format" },
            totalTaxableAmount: { type: Type.NUMBER, description: "The total taxable amount" },
            totalTax: { type: Type.NUMBER, description: "The total tax amount" },
            totalAmount: { type: Type.NUMBER, description: "The total amount on the receipt" },
            currency: { type: Type.STRING, description: "The currency code or symbol" },
            category: { type: Type.STRING, description: "The expense category" },
            buyerName: { type: Type.STRING, description: "The name of the buyer" },
            buyerPin: { type: Type.STRING, description: "The PIN of the buyer" },
            scuSignature: { type: Type.STRING, description: "The SCU Signature or receipt hash" }
          },
          required: ["merchantName", "date", "totalAmount", "currency", "category"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    try {
      const data = JSON.parse(text);
      return {
        merchantName: data.merchantName,
        merchantKraPin: data.merchantKraPin,
        date: data.date,
        totalTaxableAmount: data.totalTaxableAmount,
        totalTax: data.totalTax,
        totalAmount: data.totalAmount,
        currency: data.currency,
        category: data.category,
        buyerName: data.buyerName,
        buyerPin: data.buyerPin,
        scuSignature: data.scuSignature
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
