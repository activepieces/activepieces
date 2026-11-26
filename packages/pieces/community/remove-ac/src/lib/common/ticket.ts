import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { ssrfIpClassifier } from '@activepieces/core-utils';

async function uploadWithTicket({ apiKey, idempotencyKey, bytes, filename, options }: TicketUpload) {
  const response = await fetch(ticketUrl, {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
      ...(idempotencyKey ? {
        'Idempotency-Key': createHash('sha256').update('remove.ac ticket: ').update(idempotencyKey).digest('hex'),
      } : {}),
    },
    redirect: 'error',
    body: JSON.stringify({
      ...options,
      foregroundSha256: createHash('sha256').update(bytes).digest('hex'),
      foregroundByteLength: bytes.length,
    }),
  });
  if (!response.ok) {
    throw new Error(`remove.ac could not issue an upload ticket (HTTP ${response.status}).`);
  }

  const { data }: TicketResponse = await response.json();
  try {
    if (typeof data?.ticket !== 'string' || !data.ticket.trim() || typeof data.directEndpoint !== 'string') {
      throw new Error('remove.ac returned an invalid upload ticket.');
    }

    const endpoint = URL.canParse(data.directEndpoint) ? new URL(data.directEndpoint) : undefined;
    if (!endpoint || endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.port) {
      throw new Error('remove.ac returned an invalid upload endpoint.');
    }

    const addresses = await lookup(endpoint.hostname.replace(/^\[|\]$/g, ''), { all: true });
    if (!addresses.length || addresses.some(({ address }) => ssrfIpClassifier.isBlockedIp({ ip: address, allowList: [] }))) {
      throw new Error('remove.ac returned an upload endpoint without a public address.');
    }

    const form = new FormData();
    form.set('image_file', new Blob([bytes]), filename);
    const upload = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${data.ticket}` },
      redirect: 'error',
      signal: AbortSignal.timeout(180_000),
      body: form,
    });
    if (!upload.ok) {
      await upload.body?.cancel();
      throw new Error(`remove.ac ticket upload failed (HTTP ${upload.status}).`);
    }
    return upload;
  } catch (error) {
    const holdId = data?.holdId ?? data?.hold_id ?? data?.lock_id;
    const releaseToken = data?.releaseToken ?? data?.release_token;
    if (typeof holdId === 'string' && typeof releaseToken === 'string') {
      await fetch(`${ticketUrl}/release`, {
        method: 'POST',
        headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
        redirect: 'error',
        signal: AbortSignal.timeout(5_000),
        body: JSON.stringify({ holdId, releaseToken }),
      }).then((release) => release.body?.cancel()).catch(() => undefined);
    }
    throw error;
  }
}

const ticketUrl = 'https://remove.ac/v1.0/removebg/ticket';

export const removeAcTicket = { uploadWithTicket };

type TicketUpload = {
  apiKey: string;
  idempotencyKey?: string;
  bytes: Buffer;
  filename: string;
  options: Record<string, string | boolean | undefined>;
};

type TicketResponse = {
  data?: {
    ticket?: unknown;
    directEndpoint?: unknown;
    holdId?: unknown;
    hold_id?: unknown;
    lock_id?: unknown;
    releaseToken?: unknown;
    release_token?: unknown;
  };
};
