/**
 * Module: src/infrastructure/ocr/GeminiProvider.ts
 * Description: Implementation of IOCRProvider using Google Gemini AI.
 */

import { GoogleGenAI } from "@google/genai";
import { IOCRProvider } from "@/domain/interfaces";
import { OCRResult } from "@/domain/entities";

export class GeminiProvider implements IOCRProvider {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Analyzes a receipt image and returns extracted data using Gemini.
   * @param imageBytes - Raw image bytes (Blob or File).
   * @returns A promise that resolves to an OCRResult.
   */
  async analyzeImage(imageBytes: Blob | File): Promise<OCRResult> {
    const base64Data = await this.toBase64(imageBytes);
    
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            text: `Extract receipt data into a JSON object with these fields:
            merchantName (string),
            merchantKraPin (string, e.g. P051234567Z),
            date (string, YYYY-MM-DD),
            totalTaxableAmount (number),
            totalTax (number),
            totalAmount (number),
            currency (string, e.g. KES),
            category (string, e.g. Food, Transport, Utilities),
            buyerPin (string, e.g. P051234567Z),
            cuInvoiceNumber (string, the long numeric code next to the KRA QR code).
            
            Return ONLY the JSON object.`,
          },
          {
            inlineData: {
              mimeType: imageBytes.type || "image/jpeg",
              data: base64Data,
            },
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as OCRResult;
  }

  private toBase64(blob: Blob | File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(",")[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
