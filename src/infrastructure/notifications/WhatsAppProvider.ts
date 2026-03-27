/**
 * Module: src/infrastructure/notifications/WhatsAppProvider.ts
 * Description: Implementation of INotificationProvider for WhatsApp messaging.
 */

import { INotificationProvider } from "@/domain/interfaces";

export class WhatsAppProvider implements INotificationProvider {
  /**
   * Sends a WhatsApp message by opening a WhatsApp URL.
   * @param to - The recipient's phone number.
   * @param content - The message content.
   * @returns A promise that resolves to true if the message was sent successfully.
   */
  async sendMessage(to: string, content: string): Promise<boolean> {
    try {
      const encodedMessage = encodeURIComponent(content);
      const whatsappUrl = `https://wa.me/${to}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      return true;
    } catch (e) {
      console.error("Failed to send WhatsApp message", e);
      return false;
    }
  }
}
