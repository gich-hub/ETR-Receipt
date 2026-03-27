/**
 * Module: src/domain/interfaces.ts
 * Description: Defines the abstract contracts for providers to ensure interchangeability.
 */

import { Receipt, Persona, OCRResult } from './entities';

export interface IOCRProvider {
  /**
   * Analyzes a receipt image and returns extracted data.
   * @param imageBytes - Raw image bytes (Blob or File).
   * @returns A promise that resolves to an OCRResult.
   */
  analyzeImage(imageBytes: Blob | File): Promise<OCRResult>;
}

export interface IDatabaseProvider {
  /**
   * Saves a receipt to the database.
   * @param receipt - The receipt entity to save.
   * @returns A promise that resolves to the final image URL after upload.
   */
  saveReceipt(receipt: Receipt): Promise<string>;

  /**
   * Retrieves stats for the current month.
   * @param ownerId - The user ID.
   * @returns A promise that resolves to { total: number, count: number }.
   */
  getMonthlyStats(ownerId: string): Promise<{ total: number, count: number }>;

  /**
   * Retrieves all receipts for a specific owner.
   * @param ownerId - The ID of the authenticated user.
   * @returns A promise that resolves to an array of receipts.
   */
  getReceipts(ownerId: string): Promise<Receipt[]>;

  /**
   * Deletes a receipt from the database.
   * @param receiptId - The unique identifier of the receipt.
   * @param ownerId - The ID of the authenticated user.
   * @returns A promise that resolves when the deletion is complete.
   */
  deleteReceipt(receiptId: string, ownerId: string): Promise<void>;

  /**
   * Retrieves a single receipt by its ID.
   * @param receiptId - The unique identifier of the receipt.
   * @param ownerId - The ID of the authenticated user.
   * @returns A promise that resolves to the receipt or null if not found.
   */
  getReceipt(receiptId: string, ownerId: string): Promise<Receipt | null>;

  /**
   * Saves a persona.
   * @param persona - The persona entity to save.
   * @returns A promise that resolves when the save is complete.
   */
  savePersona(persona: Persona): Promise<void>;

  /**
   * Deletes a persona.
   * @param personaId - The ID of the persona.
   * @param ownerId - The ID of the user.
   * @returns A promise that resolves when the deletion is complete.
   */
  deletePersona(personaId: string, ownerId: string): Promise<void>;

  /**
   * Subscribes to personas for a user.
   * @param ownerId - The ID of the user.
   * @param callback - The callback function to handle persona updates.
   * @returns An unsubscribe function.
   */
  subscribeToPersonas(ownerId: string, callback: (personas: Persona[]) => void): () => void;
}

export interface INotificationProvider {
  /**
   * Sends a notification (e.g., WhatsApp message).
   * @param to - The recipient's phone number.
   * @param content - The message content.
   * @returns A promise that resolves to true if the message was sent successfully.
   */
  sendMessage(to: string, content: string): Promise<boolean>;
}
