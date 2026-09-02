import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { isNil, tryCatch } from '@activepieces/pieces-framework';
import crypto from 'crypto';

async function sendRow({
    webhookUrl,
    authToken,
    row,
}: {
    webhookUrl: string;
    authToken?: string;
    row: Record<string, unknown>;
}): Promise<ClayWebhookResult> {
    const url = normalizeSourceUrl(webhookUrl);
    const result = await tryCatch(() =>
        httpClient.sendRequest<unknown>({
            method: HttpMethod.POST,
            url,
            headers: isNil(authToken)
                ? undefined
                : { [WEBHOOK_AUTH_HEADER]: authToken },
            body: row,
        }),
    );

    if (result.error !== null) {
        throw new Error(sendFailureMessage({ error: result.error, authToken }));
    }

    return { success: true, response: result.data.body };
}

function verifySignature({
    signingSecret,
    rawBody,
    signatureHeader,
}: {
    signingSecret: string;
    rawBody: unknown;
    signatureHeader: string | undefined;
}): boolean {
    const signedBytes = signedPayloadOf(rawBody);
    if (isNil(signatureHeader) || isNil(signedBytes)) {
        return false;
    }

    const provided = signatureHeader.startsWith(SIGNATURE_PREFIX)
        ? signatureHeader.slice(SIGNATURE_PREFIX.length)
        : signatureHeader;
    const expected = crypto
        .createHmac('sha256', signingSecret)
        .update(signedBytes)
        .digest('hex');

    const providedBytes = Buffer.from(provided, 'hex');
    const expectedBytes = Buffer.from(expected, 'hex');
    if (
        providedBytes.length === 0 ||
        providedBytes.length !== expectedBytes.length
    ) {
        return false;
    }

    return crypto.timingSafeEqual(providedBytes, expectedBytes);
}

function signatureHeaderOf(headers: Record<string, string> | undefined): string | undefined {
    if (isNil(headers)) {
        return undefined;
    }
    const match = Object.keys(headers).find(
        (name) => name.toLowerCase() === SIGNATURE_HEADER,
    );
    return isNil(match) ? undefined : headers[match];
}

function isVerificationPing(body: unknown): boolean {
    if (typeof body !== 'object' || isNil(body)) {
        return false;
    }
    if (isNil(Reflect.get(body, 'webhookId'))) {
        return false;
    }
    const row = Reflect.get(body, 'data');
    if (isNil(row)) {
        return true;
    }
    return typeof row === 'object' && Object.keys(row).length === 0;
}

function signedPayloadOf(rawBody: unknown): string | Buffer | undefined {
    if (typeof rawBody === 'string' || Buffer.isBuffer(rawBody)) {
        return rawBody;
    }
    return undefined;
}

function normalizeSourceUrl(webhookUrl: string): string {
    const trimmed = webhookUrl.trim();
    if (trimmed.length === 0) {
        throw new Error('Webhook URL is required');
    }
    if (!/^https?:\/\//i.test(trimmed)) {
        throw new Error(
            'Webhook URL must start with http:// or https://. Copy it from the Webhook URL panel on your Clay table source.',
        );
    }
    return trimmed;
}

function sendFailureMessage({
    error,
    authToken,
}: {
    error: Error;
    authToken?: string;
}): string {
    const status = statusOf(error);

    if (status === 401) {
        return isNil(authToken)
            ? 'Clay rejected the row with 401 Unauthorized. This webhook source has an authentication token, so fill in Authentication Token with the value Clay showed when the source was created.'
            : 'Clay rejected the row with 401 Unauthorized. The authentication token does not match the one on this Clay webhook source. Note that a newly refreshed token can take up to a minute to become active.';
    }
    if (status === 404) {
        return 'Clay returned 404 for this webhook URL. Check the URL against the Webhook URL panel on the table source, and that the source has not been deleted.';
    }

    return `Clay rejected the row${isNil(status) ? '' : ` with ${status}`}: ${error.message}`;
}

function statusOf(error: unknown): number | undefined {
    if (typeof error !== 'object' || isNil(error)) {
        return undefined;
    }
    const response = Reflect.get(error, 'response');
    if (typeof response !== 'object' || isNil(response)) {
        return undefined;
    }
    const status = Reflect.get(response, 'status');
    return typeof status === 'number' ? status : undefined;
}

export const clayWebhook = {
    sendRow,
    verifySignature,
    signatureHeaderOf,
    isVerificationPing,
    normalizeSourceUrl,
};

export const WEBHOOK_AUTH_HEADER = 'x-clay-webhook-auth';
export const SIGNATURE_HEADER = 'x-clay-signature';
export const SIGNATURE_PREFIX = 'sha256=';

export type ClayWebhookResult = {
    success: boolean;
    response: unknown;
};
