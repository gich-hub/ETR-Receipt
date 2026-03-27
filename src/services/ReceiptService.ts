/**
 * Module: src/services/ReceiptService.ts
 * Description: Orchestrates the OCR, Database, and Notification providers.
 */

import { IOCRProvider, IDatabaseProvider, INotificationProvider } from '@/domain/interfaces';
import { Receipt, OCRResult, Persona } from '@/domain/entities';
import { TaxValidator } from './TaxValidator';
import { AppLogger } from '@/utils/logger';

export class ReceiptService {
  constructor(
    private ocr: IOCRProvider,
    private db: IDatabaseProvider,
    private notify: INotificationProvider
  ) {}

  /**
   * Processes an image and returns extracted data.
   * @param image - The receipt image (Blob or File).
   * @returns A promise that resolves to an OCRResult.
   */
  async processImage(image: Blob | File): Promise<OCRResult> {
    try {
      return await this.ocr.analyzeImage(image);
    } catch (e) {
      AppLogger.error("OCR Processing Failed", e);
      throw e;
    }
  }

  /**
   * Saves a receipt and optionally sends a notification.
   * @param receipt - The receipt entity to save.
   * @param persona - The selected persona for notification.
   * @returns A promise that resolves to the final image URL.
   */
  async saveAndNotify(receipt: Receipt, persona?: Persona): Promise<string> {
    try {
      // 1. Save to database
      const finalImageUrl = await this.db.saveReceipt(receipt);

      // 2. Send notification (WhatsApp) - Modular error handling
      if (persona?.phone) {
        const message = `Receipt Saved!\nMerchant: ${receipt.merchantName}\nDate: ${receipt.date}\nAmount: ${TaxValidator.formatCurrency(receipt.totalAmount, receipt.currency)}\nCU Invoice: ${receipt.cuInvoiceNumber || 'N/A'}\nView: ${finalImageUrl}`;
        
        // Failure in notification does not crash the save flow
        this.notify.sendMessage(persona.phone, message).catch(e => {
          AppLogger.warn("WhatsApp Notification Failed", e);
        });
      }

      return finalImageUrl;
    } catch (e) {
      AppLogger.error("Failed to save receipt", e);
      throw e;
    }
  }

  /**
   * Retrieves a single receipt.
   * @param receiptId - The ID of the receipt.
   * @param ownerId - The ID of the user.
   * @returns A promise that resolves to the receipt or null.
   */
  async getReceipt(receiptId: string, ownerId: string): Promise<Receipt | null> {
    try {
      return await this.db.getReceipt(receiptId, ownerId);
    } catch (e) {
      AppLogger.error("Failed to fetch receipt", e);
      throw e;
    }
  }

  /**
   * Retrieves stats for the current month.
   * @param ownerId - The ID of the user.
   * @returns A promise that resolves to { total: number, count: number }.
   */
  async getMonthlyStats(ownerId: string): Promise<{ total: number, count: number }> {
    try {
      return await this.db.getMonthlyStats(ownerId);
    } catch (e) {
      AppLogger.error("Failed to fetch monthly stats", e);
      return { total: 0, count: 0 };
    }
  }

  /**
   * Retrieves all receipts for a user.
   * @param ownerId - The ID of the user.
   * @returns A promise that resolves to an array of receipts.
   */
  async fetchReceipts(ownerId: string): Promise<Receipt[]> {
    try {
      return await this.db.getReceipts(ownerId);
    } catch (e) {
      AppLogger.error("Failed to fetch receipts", e);
      throw e;
    }
  }

  /**
   * Deletes a receipt.
   * @param receiptId - The ID of the receipt.
   * @param ownerId - The ID of the user.
   * @returns A promise that resolves when the deletion is complete.
   */
  async deleteReceipt(receiptId: string, ownerId: string): Promise<void> {
    try {
      await this.db.deleteReceipt(receiptId, ownerId);
    } catch (e) {
      AppLogger.error("Failed to delete receipt", e);
      throw e;
    }
  }
}
