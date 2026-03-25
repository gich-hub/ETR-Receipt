import { GoogleGenAI, Type } from "@google/genai";

export interface OCRResult {
  merchantName?: string;
  merchantKraPin?: string;
  date?: string;
  totalTaxableAmount?: number;
  totalTax?: number;
  totalAmount?: number;
  currency?: string;
  category?: string;
  buyerPin?: string;
  cuInvoiceNumber?: string;
}

export async function analyzeReceipt(imageBlob: Blob): Promise<OCRResult> {
  try {
    // Initialize the Gemini API client inside the function
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
      - Buyer PIN (by default the receipt should contain the buyer PIN, extract it if present)
      - Control Unit Invoice Number (a long numeric code issued by KRA, usually alongside a QR code)

      Return a JSON object with these keys: merchantName, merchantKraPin, date, totalTaxableAmount, totalTax, totalAmount, currency, category, buyerPin, cuInvoiceNumber.
      If a value is not found, omit the key or return null.
    `;

    // Determine mimeType
    let mimeType = imageBlob.type;
    if (!mimeType || mimeType === 'application/octet-stream' || mimeType === '') {
      // Try to guess from filename if it's a File object
      const filename = (imageBlob as File).name?.toLowerCase() || '';
      if (filename.endsWith('.heic') || filename.endsWith('.heif')) {
        mimeType = 'image/heic';
      } else if (filename.endsWith('.png')) {
        mimeType = 'image/png';
      } else if (filename.endsWith('.webp')) {
        mimeType = 'image/webp';
      } else {
        mimeType = 'image/jpeg';
      }
    } else if (mimeType === 'image/jpg') {
      mimeType = 'image/jpeg';
    }
    console.log("Using mimeType for Gemini:", mimeType);

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType, data: base64Data } },
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
            buyerPin: { type: Type.STRING, description: "The PIN of the buyer" },
            cuInvoiceNumber: { type: Type.STRING, description: "The Control Unit Invoice Number (long numeric code)" }
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
        buyerPin: data.buyerPin,
        cuInvoiceNumber: data.cuInvoiceNumber
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
