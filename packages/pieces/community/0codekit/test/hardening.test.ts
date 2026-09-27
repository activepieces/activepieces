import { beforeEach, describe, expect, it, vi } from 'vitest';
import { validateIbanAction } from '../src/lib/actions/business/validate-iban';
import { zeroCodeKitApi, ZEROCODEKIT_TIMEOUT_MS } from '../src/lib/common/client';
import { runAction } from './helpers';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
    return {
        ...actual,
        httpClient: {
            sendRequest: (...args: unknown[]) => sendRequest(...args),
        },
    };
});

const STEP_LIMIT_MS = 600_000;
const write = vi.fn();

function respond(body: unknown) {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body });
}

function call(index: number) {
    return sendRequest.mock.calls[index][0];
}

beforeEach(() => {
    sendRequest.mockReset();
    write.mockReset();
    write.mockImplementation(async ({ fileName }: { fileName: string }) => `file://${fileName}`);
});

describe('request timeouts', () => {
    it('gives simple lookups a 30 second timeout', async () => {
        respond({ valid: true });
        await runAction({ action: validateIbanAction, propsValue: { iban: 'DE89370400440532013000' }, write });
        expect(call(0).timeout).toBe(30_000);
    });

    it('bounds every timeout class below the step limit', () => {
        for (const value of Object.values(ZEROCODEKIT_TIMEOUT_MS)) {
            expect(value).toBeGreaterThan(0);
            expect(value).toBeLessThan(STEP_LIMIT_MS);
        }
        expect(zeroCodeKitApi.timeoutFor('/storage/perm/add')).toBe(120_000);
        expect(zeroCodeKitApi.timeoutFor('/generate/qrcode/decode')).toBe(120_000);
        expect(zeroCodeKitApi.timeoutFor('/storage/perm/list')).toBe(30_000);
    });

    it('reports a timeout in plain words', async () => {
        const abort = new Error('This operation was aborted');
        abort.name = 'AbortError';
        sendRequest.mockRejectedValueOnce(abort);
        await expect(runAction({ action: validateIbanAction, propsValue: { iban: 'DE89' }, write })).rejects.toThrow(
            /did not answer in time/,
        );
    });
});
