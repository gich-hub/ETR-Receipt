/**
 * Module: src/services/index.ts
 * Description: Initializes and exports the application services.
 */

import { FirestoreProvider } from '@/infrastructure/database/FirestoreProvider';
import { GeminiProvider } from '@/infrastructure/ocr/GeminiProvider';
import { WhatsAppProvider } from '@/infrastructure/notifications/WhatsAppProvider';
import { ReceiptService } from './ReceiptService';
import { PersonaService } from './PersonaService';
import { OCRService } from './OCRService';

// 1. Initialize Providers
const dbProvider = new FirestoreProvider();
const ocrProvider = new GeminiProvider(process.env.GEMINI_API_KEY || '');
const notificationProvider = new WhatsAppProvider();

// 2. Initialize and Export Services
export const receiptService = new ReceiptService(
  ocrProvider,
  dbProvider,
  notificationProvider
);

export const personaService = new PersonaService(dbProvider);
export const ocrService = new OCRService(ocrProvider);

export { TaxValidator } from './TaxValidator';
export { AppLogger } from '@/utils/logger';
export type { Receipt, Persona, OCRResult } from '@/domain/entities';
