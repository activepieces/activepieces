import type { RenderEventObject } from './types';

export function readEventEnvelopeObject(body: unknown): RenderEventObject | undefined {
  if (typeof body !== 'object' || body === null || !('data' in body)) return undefined;
  const data = body.data;
  if (typeof data !== 'object' || data === null || !('object' in data)) return undefined;
  return isRenderEventObject(data.object) ? data.object : undefined;
}

function isRenderEventObject(value: unknown): value is RenderEventObject {
  return typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'string';
}
