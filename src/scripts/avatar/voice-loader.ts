/**
 * Chunk asíncrono de voces: los MP3 y sus URLs no van en el entry del avatar-client.
 */

export type VoicesModule = typeof import('./voices');

let voicesModulePromise: Promise<VoicesModule> | null = null;

export function loadVoicesModule() {
  voicesModulePromise ??= import('./voices');
  return voicesModulePromise;
}
