/**
 * Module: src/services/OCRService.ts
 * Description: Handles OCR operations.
 */

import { IOCRProvider } from '@/domain/interfaces';
import { OCRResult } from '@/domain/entities';
import { AppLogger } from '@/utils/logger';

export class OCRService {
  constructor(private ocr: IOCRProvider) {}

  /**
   * Analyzes a receipt image.
   * @param image - The receipt image (Blob or File).
   * @returns A promise that resolves to an OCRResult.
   */
  async analyzeReceipt(image: Blob | File): Promise<OCRResult> {
    try {
      return await this.ocr.analyzeImage(image);
    } catch (e) {
      AppLogger.error("OCR Processing Failed", e);
      throw e;
    }
  }
}
