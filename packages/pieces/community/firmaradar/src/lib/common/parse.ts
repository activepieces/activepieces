/**
 * Pure input-/payload-parsing helpers shared by actions and triggers.
 * Kept free of framework imports so they are trivially unit-testable.
 */

/**
 * Normalise a list of Norwegian organisation numbers.
 *
 * Accepts an array (Activepieces `Property.Array` value) or a free-text
 * string; each element may itself contain comma/space/semicolon/newline
 * separated values. Empty entries are dropped. Format and count limits
 * are enforced by the backend (per-orgnr errors), so no validation here.
 */
export function parseOrgnrs(value: unknown): string[] {
    const parts: string[] = [];
    const push = (raw: unknown) => {
        for (const piece of String(raw ?? '').split(/[\s,;]+/)) {
            const trimmed = piece.trim();
            if (trimmed.length > 0) {
                parts.push(trimmed);
            }
        }
    };
    if (Array.isArray(value)) {
        for (const item of value) push(item);
    } else {
        push(value);
    }
    return parts;
}

/** Trimmed string list from an Activepieces array prop; empty → []. */
export function stringList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
        .map((item) => String(item ?? '').trim())
        .filter((item) => item.length > 0);
}

/**
 * Extract the subscription id from a subscribe response.
 *
 * Per-orgnr monitoring (`POST /api/v1/monitoring/webhooks`) returns `id`
 * at the top level; NACE (`POST /api/v1/nace/subscriptions`) nests it
 * under `subscription.id`. See docs/integrasjoner/WEBHOOK_TRIGGERS.md.
 */
export function extractSubscriptionId(response: unknown): number | string | undefined {
    const record = response as Record<string, unknown> | null;
    if (!record || typeof record !== 'object') return undefined;
    if (record.id !== undefined && record.id !== null) {
        return record.id as number | string;
    }
    const subscription = record.subscription as Record<string, unknown> | undefined;
    if (subscription && subscription.id !== undefined && subscription.id !== null) {
        return subscription.id as number | string;
    }
    return undefined;
}

/**
 * Verify a delivery's `Authorization: Bearer` header against the configured
 * delivery secret. Firmaradar echoes the secret as `Authorization: Bearer
 * <secret>` on every webhook delivery (see WEBHOOK_TRIGGERS.md), so a
 * mismatch means the request did not come from Firmaradar. No secret
 * configured → accept (verification is opt-in).
 */
export function isAuthenticDelivery(
    deliverySecret: string | undefined,
    headers: Record<string, unknown> | undefined,
): boolean {
    if (!deliverySecret) {
        return true;
    }
    let auth: unknown;
    for (const [key, value] of Object.entries(headers ?? {})) {
        if (key.toLowerCase() === 'authorization') {
            auth = value;
            break;
        }
    }
    const value = Array.isArray(auth) ? auth[0] : auth;
    return typeof value === 'string' && value.trim() === `Bearer ${deliverySecret}`;
}

export interface MonitoringWebhookInput {
    orgnr: string;
    url: string;
    deliverySecret?: string;
}

/** Body for `POST /api/v1/monitoring/webhooks` (WebhookSubscriptionCreate). */
export function buildMonitoringWebhookBody(input: MonitoringWebhookInput): Record<string, unknown> {
    const body: Record<string, unknown> = {
        orgnr: input.orgnr,
        url: input.url,
    };
    if (input.deliverySecret) {
        body.delivery_key = input.deliverySecret;
    }
    return body;
}

export interface NaceSubscriptionInput {
    naceCode: string;
    url: string;
    events?: string[];
    aggregationMode?: string;
    fylkeFilter?: unknown;
    kommuneFilter?: unknown;
    landsdelFilter?: unknown;
    minAnsatte?: number;
    minOmsetningNok?: number;
    deliverySecret?: string;
}

/**
 * Body for `POST /api/v1/nace/subscriptions` (NaceSubscriptionCreate).
 * Empty lists and unset thresholds are omitted (backend treats omitted
 * `events` as "all event types").
 */
export function buildNaceSubscriptionBody(input: NaceSubscriptionInput): Record<string, unknown> {
    const body: Record<string, unknown> = {
        nace_code: input.naceCode,
        url: input.url,
    };
    if (input.deliverySecret) {
        body.bearer_token = input.deliverySecret;
    }
    if (input.aggregationMode) {
        body.aggregation_mode = input.aggregationMode;
    }
    if (input.events && input.events.length > 0) {
        body.events = input.events;
    }
    const filters: Array<[string, unknown]> = [
        ['fylke_filter', input.fylkeFilter],
        ['kommune_filter', input.kommuneFilter],
        ['landsdel_filter', input.landsdelFilter],
    ];
    for (const [key, raw] of filters) {
        const list = stringList(raw);
        if (list.length > 0) {
            body[key] = list;
        }
    }
    if (input.minAnsatte && input.minAnsatte > 0) {
        body.min_ansatte = input.minAnsatte;
    }
    if (input.minOmsetningNok && input.minOmsetningNok > 0) {
        body.min_omsetning_nok = input.minOmsetningNok;
    }
    return body;
}
