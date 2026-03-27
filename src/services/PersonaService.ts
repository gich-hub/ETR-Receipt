/**
 * Module: src/services/PersonaService.ts
 * Description: Handles persona-related database operations.
 */

import { IDatabaseProvider } from '@/domain/interfaces';
import { Persona } from '@/domain/entities';
import { AppLogger } from '@/utils/logger';

export class PersonaService {
  constructor(private db: IDatabaseProvider) {}

  /**
   * Saves a persona.
   * @param persona - The persona entity to save.
   * @returns A promise that resolves when the save is complete.
   */
  async savePersona(persona: Persona): Promise<void> {
    try {
      await this.db.savePersona(persona);
    } catch (e) {
      AppLogger.error("Failed to save persona", e);
      throw e;
    }
  }

  /**
   * Deletes a persona.
   * @param personaId - The ID of the persona.
   * @param ownerId - The ID of the user.
   * @returns A promise that resolves when the deletion is complete.
   */
  async deletePersona(personaId: string, ownerId: string): Promise<void> {
    try {
      await this.db.deletePersona(personaId, ownerId);
    } catch (e) {
      AppLogger.error("Failed to delete persona", e);
      throw e;
    }
  }

  /**
   * Subscribes to personas for a user.
   * @param ownerId - The ID of the user.
   * @param callback - The callback function to handle persona updates.
   * @returns An unsubscribe function.
   */
  subscribeToPersonas(ownerId: string, callback: (personas: Persona[]) => void): () => void {
    return this.db.subscribeToPersonas(ownerId, callback);
  }
}
