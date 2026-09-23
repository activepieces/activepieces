import { Store, StoreScope } from '@activepieces/pieces-framework';
import { createHash, randomUUID } from 'node:crypto';

// Settle window; must exceed one Wavix GET+register round-trip.
const CLAIM_SETTLE_MS = 2000;

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function smsEnableLockKey(numberId: string | number): string {
  return `sms_enable_lock:${numberId}`;
}

export function postCallEnableLockKey(apiKey: string): string {
  const digest = createHash('sha256')
    .update(apiKey)
    .digest('base64url')
    .slice(0, 22);
  return `post_call_enable_lock:${digest}`;
}

// Lockless claim (store has no CAS): write a unique token, let the settle window pass so concurrent enables have written too, then read back — only the last writer wins and registers; losers back off.
export async function claimWebhookSlot(params: {
  store: Store;
  key: string;
  webhookUrl: string;
  occupiedMessage: string;
  getCurrentUrl: () => Promise<string | null | undefined>;
  register: () => Promise<void>;
}): Promise<void> {
  const { store, key, webhookUrl, occupiedMessage, getCurrentUrl, register } =
    params;

  const token = randomUUID();
  await store.put(key, token, StoreScope.PROJECT);
  await pause(CLAIM_SETTLE_MS);
  if ((await store.get<string>(key, StoreScope.PROJECT)) !== token) {
    throw new Error(
      'Another Activepieces flow is enabling on this Wavix target. Try again in a moment.'
    );
  }

  try {
    const current = await getCurrentUrl();
    if (current && current !== webhookUrl) {
      throw new Error(occupiedMessage);
    }
    if (!current) {
      await register();
    }
  } finally {
    await store.delete(key, StoreScope.PROJECT);
  }
}
