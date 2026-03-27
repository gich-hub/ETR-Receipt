/**
 * Module: src/services/TaxValidator.ts
 * Description: Decoupled logic for KRA tax validation and PIN matching.
 */

export class TaxValidator {
  /**
   * Validates the format of a KRA PIN.
   * @param pin - The KRA PIN to validate (e.g., 'P051234567Z').
   * @returns True if the PIN format is valid.
   */
  static validateKraPin(pin: string): boolean {
    const pattern = /^[PA]\d{9}[A-Z]$/i;
    return pattern.test(pin.trim());
  }

  /**
   * Checks if the extracted buyer PIN matches the persona's KRA PIN.
   * @param extractedPin - The PIN extracted from the receipt.
   * @param personaPin - The KRA PIN of the selected persona.
   * @returns True if the PINs match or if one is missing.
   */
  static checkPinMatch(extractedPin?: string, personaPin?: string): boolean {
    if (!extractedPin || !personaPin) return true;
    return extractedPin.trim().toUpperCase() === personaPin.trim().toUpperCase();
  }

  /**
   * Formats a numeric value as a currency string.
   * @param amount - The numeric amount.
   * @param currency - The currency code (e.g., 'KES').
   * @returns A formatted currency string.
   */
  static formatCurrency(amount: number, currency: string = 'KES'): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }
}
