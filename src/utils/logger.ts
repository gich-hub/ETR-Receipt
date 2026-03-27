/**
 * Module: src/utils/logger.ts
 * Description: Modular error handling and logging utility.
 */

export class AppLogger {
  /**
   * Logs an error message and optional data.
   * @param message - The error message.
   * @param error - The error object or data.
   */
  static error(message: string, error?: any): void {
    console.error(`[ERROR] ${message}:`, error);
    // Future: Send to Sentry, LogRocket, etc.
  }

  /**
   * Logs a warning message and optional data.
   * @param message - The warning message.
   * @param data - The warning data.
   */
  static warn(message: string, data?: any): void {
    console.warn(`[WARN] ${message}:`, data);
  }

  /**
   * Logs an informational message and optional data.
   * @param message - The info message.
   * @param data - The info data.
   */
  static info(message: string, data?: any): void {
    console.info(`[INFO] ${message}:`, data);
  }

  /**
   * Formats an error for user display.
   * @param error - The error object.
   * @returns A user-friendly error message.
   */
  static formatUserError(error: any): string {
    let message = "";
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else {
      return "An unexpected error occurred. Please try again.";
    }

    // Check if it's a JSON error from our FirestoreProvider
    try {
      const parsed = JSON.parse(message);
      if (parsed && typeof parsed === 'object' && parsed.error) {
        // If it's a storage retry limit error, give a better message
        if (parsed.error.includes("storage/retry-limit-exceeded") || parsed.error.includes("Max retry time") || parsed.error.includes("Storage upload timeout")) {
          return "Storage upload failed. This usually means Firebase Storage is not enabled for your project. Please go to the Firebase Console, select your project, click on 'Storage' in the left menu, and click 'Get Started'.";
        }
        if (parsed.error.includes("permission-denied")) {
          return "Permission denied. Please ensure you are logged in and have access.";
        }
        return parsed.error;
      }
    } catch (e) {
      // Not a JSON string, continue with original message
    }

    return message || "An unexpected error occurred. Please try again.";
  }
}
