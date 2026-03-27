/**
 * Module: src/domain/entities.ts
 * Description: Defines the core data structures (Entities) used across the application.
 */

export interface Receipt {
  /** Unique identifier for the receipt. */
  id: string;
  /** Name of the merchant or activity. */
  merchantName: string;
  /** KRA PIN of the merchant. */
  merchantKraPin?: string;
  /** Date of the transaction (YYYY-MM-DD). */
  date: string;
  /** Total taxable amount. */
  totalTaxableAmount?: number;
  /** Total tax amount. */
  totalTax?: number;
  /** Total amount of the transaction. */
  totalAmount: number;
  /** Currency code (e.g., KES, USD). */
  currency: string;
  /** Category of the expense. */
  category: string;
  /** KRA PIN of the buyer. */
  buyerPin?: string;
  /** Control Unit Invoice Number (KRA). */
  cuInvoiceNumber?: string;
  /** Sync status of the receipt. */
  status: 'pending' | 'synced';
  /** Timestamp when the receipt was created. */
  createdAt: number;
  /** URL of the receipt image in cloud storage. */
  imageUrl?: string;
  /** User ID of the receipt owner. */
  ownerId: string;
  /** Local image blob (before upload). */
  imageBlob?: Blob;
}

export interface Persona {
  /** Unique identifier for the persona. */
  id: string;
  /** Official entity name. */
  name: string;
  /** KRA PIN of the persona. */
  kraPin: string;
  /** Phone number for auto-send. */
  phone: string;
  /** User ID of the persona owner. */
  ownerId: string;
}

export interface OCRResult {
  /** Extracted merchant name. */
  merchantName?: string;
  /** Extracted merchant KRA PIN. */
  merchantKraPin?: string;
  /** Extracted date (YYYY-MM-DD). */
  date?: string;
  /** Extracted taxable amount. */
  totalTaxableAmount?: number;
  /** Extracted tax amount. */
  totalTax?: number;
  /** Extracted total amount. */
  totalAmount?: number;
  /** Extracted currency code. */
  currency?: string;
  /** Extracted category. */
  category?: string;
  /** Extracted buyer PIN. */
  buyerPin?: string;
  /** Extracted CU Invoice Number. */
  cuInvoiceNumber?: string;
}
