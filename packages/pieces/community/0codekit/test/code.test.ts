import { HttpError } from '@activepieces/pieces-common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runJavascriptCodeAction } from '../src/lib/actions/code/run-javascript-code';
import { runPythonCodeAction } from '../src/lib/actions/code/run-python-code';
import { cryptoDecryptAction } from '../src/lib/actions/crypto/crypto-decrypt';
import { cryptoEncryptAction } from '../src/lib/actions/crypto/crypto-encrypt';
import { cryptoHashAction } from '../src/lib/actions/crypto/crypto-hash';
import { createASchedulerAction } from '../src/lib/actions/scheduler/create-a-scheduler';
import { deleteASchedulerAction } from '../src/lib/actions/scheduler/delete-a-scheduler';
import { listSchedulersAction } from '../src/lib/actions/scheduler/list-schedulers';
import { CODE_TIMEOUT_MS } from '../src/lib/common/code';
import { loadDropdownOptions, runAction, TEST_AUTH } from './helpers';

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

function respond(body: unknown) {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body });
}

function fail({ status, body }: { status: number; body: unknown }) {
    sendRequest.mockRejectedValueOnce(new HttpError({}, { status, responseBody: body }));
}

function sent(index = 0) {
    return sendRequest.mock.calls[index][0];
}

beforeEach(() => {
    sendRequest.mockReset();
});

describe('metadata', () => {
    const actions: [string, MetadataAction, string, boolean][] = [
        ['Run Javascript Code', runJavascriptCodeAction, 'WRITE', false],
        ['Run Python Code', runPythonCodeAction, 'WRITE', false],
        ['Crypto Decrypt', cryptoDecryptAction, 'READ', true],
        ['Crypto Encrypt', cryptoEncryptAction, 'READ', true],
        ['Crypto Hash', cryptoHashAction, 'READ', true],
        ['Create a Scheduler', createASchedulerAction, 'WRITE', false],
        ['Delete a Scheduler', deleteASchedulerAction, 'DESTRUCTIVE', false],
        ['List Schedulers', listSchedulersAction, 'SEARCH', true],
    ];

    it.each(actions)('%s has the expected metadata', (displayName, action, classification, idempotent) => {
        expect(action.displayName).toBe(displayName);
        expect(action.classification).toBe(classification);
        expect(action.audience).toBe('both');
        expect(action.aiMetadata?.idempotent).toBe(idempotent);
        expect(action.aiMetadata?.description?.length).toBeGreaterThan(20);
    });

    it('Python states the credit cost', () => {
        expect(runPythonCodeAction.description).toContain('50 credits');
    });
});

describe('code', () => {
    it('JavaScript sends code with a timeout above 180 s and wraps an object result under result', async () => {
        respond({ total: 3 });
        const result = await runAction({ action: runJavascriptCodeAction, propsValue: { code: 'return { total: 3 };', dependencies: [] } });
        expect(sent().url).toBe('https://v2.1saas.co/code/javascript');
        expect(sent().headers).toEqual({ auth: 'zck_test' });
        expect(sent().timeout).toBe(CODE_TIMEOUT_MS);
        expect(CODE_TIMEOUT_MS).toBeGreaterThan(180_000);
        expect(sent().body).toEqual({ code: 'return { total: 3 };' });
        expect(result).toEqual({ result: { total: 3 } });
    });

    it('JavaScript wraps a primitive or array result', async () => {
        respond([1, 2]);
        expect(await runAction({ action: runJavascriptCodeAction, propsValue: { code: 'return [1, 2];' } })).toEqual({ result: [1, 2] });
        respond('');
        expect(await runAction({ action: runJavascriptCodeAction, propsValue: { code: '1' } })).toEqual({ result: null });
    });

    it('JavaScript injects inputs as a const and passes system packages', async () => {
        respond({ ok: true });
        await runAction({ action: runJavascriptCodeAction, propsValue: {
            code: 'return inputs.name;',
            inputs: { name: 'a"b' },
            dependencies: ['ffmpeg', ' '],
        } });
        expect(sent().body).toEqual({
            code: 'const inputs = {"name":"a\\"b"};\nreturn inputs.name;',
            dependencies: ['ffmpeg'],
        });
    });

    it('Python unwraps result, injects inputs and passes libraries', async () => {
        respond({ result: { sum: 5 } });
        const result = await runAction({ action: runPythonCodeAction, propsValue: {
            code: 'result = {"sum": inputs["a"] + 2}',
            inputs: { a: 3 },
            requirements: ['requests'],
        } });
        expect(sent().url).toBe('https://v2.1saas.co/code/python');
        expect(sent().timeout).toBe(CODE_TIMEOUT_MS);
        expect(sent().body).toEqual({
            code: 'inputs = __import__("json").loads("{\\"a\\":3}")\nresult = {"sum": inputs["a"] + 2}',
            requirements: ['requests'],
        });
        expect(result).toEqual({ result: { sum: 5 } });
    });

    it('Python wraps a scalar result and skips empty inputs', async () => {
        respond({ result: 42 });
        const result = await runAction({ action: runPythonCodeAction, propsValue: { code: 'result = 42', inputs: {} } });
        expect(sent().body).toEqual({ code: 'result = 42' });
        expect(result).toEqual({ result: 42 });
    });

    it('surfaces the vendor error message', async () => {
        fail({ status: 400, body: { status: 400, errorMessage: 'NameError: x is not defined', code: 'bad_request' } });
        await expect(runAction({ action: runPythonCodeAction, propsValue: { code: 'result = x' } })).rejects.toThrow(
            '0CodeKit returned 400: NameError: x is not defined (bad_request)',
        );
    });

    it('explains the 180 s limit on a gateway timeout', async () => {
        fail({ status: 504, body: { errorMessage: 'Execution timed out' } });
        await expect(runAction({ action: runJavascriptCodeAction, propsValue: { code: 'while(true){}' } })).rejects.toThrow('limited to 180 seconds');
    });

    it('explains a client-side timeout', async () => {
        const abort = new Error('This operation was aborted');
        abort.name = 'AbortError';
        sendRequest.mockRejectedValueOnce(abort);
        await expect(runAction({ action: runJavascriptCodeAction, propsValue: { code: 'while(true){}' } })).rejects.toThrow(
            'did not answer within 190 seconds',
        );
    });
});

describe('crypto', () => {
    it('Encrypt sends cipher, message and key', async () => {
        respond({ encryptedText: 'U2FsdGVk' });
        const result = await runAction({ action: cryptoEncryptAction, propsValue: { cryptoType: 'AES', message: 'hi', secretKey: 'k' } });
        expect(sent().url).toBe('https://v2.1saas.co/crypto/encrypt');
        expect(sent().body).toEqual({ cryptoType: 'AES', message: 'hi', secretKey: 'k' });
        expect(result).toEqual({ encrypted_text: 'U2FsdGVk' });
    });

    it('Decrypt sends ciphertext', async () => {
        respond({ decryptedText: 'hi' });
        const result = await runAction({ action: cryptoDecryptAction, propsValue: { cryptoType: 'RC4', ciphertext: 'U2F', secretKey: 'k' } });
        expect(sent().url).toBe('https://v2.1saas.co/crypto/decrypt');
        expect(sent().body).toEqual({ cryptoType: 'RC4', ciphertext: 'U2F', secretKey: 'k' });
        expect(result).toEqual({ decrypted_text: 'hi' });
    });

    it('Hash drops the key for plain algorithms', async () => {
        respond({ hashedText: 'abc' });
        const result = await runAction({ action: cryptoHashAction, propsValue: { hashType: 'SHA256', message: 'hi', secretKey: 'k' } });
        expect(sent().url).toBe('https://v2.1saas.co/crypto/hash');
        expect(sent().body).toEqual({ hashType: 'SHA256', message: 'hi' });
        expect(result).toEqual({ hashed_text: 'abc', algorithm: 'SHA256' });
    });

    it('Hash sends the key for HMAC and requires it', async () => {
        respond({ hashedText: 'def' });
        await runAction({ action: cryptoHashAction, propsValue: { hashType: 'HmacSHA256', message: 'hi', secretKey: 'k' } });
        expect(sent().body).toEqual({ hashType: 'HmacSHA256', message: 'hi', secretKey: 'k' });
        await expect(runAction({ action: cryptoHashAction, propsValue: { hashType: 'HmacSHA256', message: 'hi' } })).rejects.toThrow(
            'needs a Secret Key',
        );
        expect(sendRequest).toHaveBeenCalledTimes(1);
    });
});

describe('scheduler', () => {
    it('Create sends a one-time schedule with stringified data', async () => {
        respond({ taskId: 't1', nextExecution: '2026-12-31T09:00:00.000Z' });
        const result = await runAction({ action: createASchedulerAction, propsValue: {
            sendToWebhook: ' https://hook.test/a ',
            data: { a: 1 },
            intervalType: '1',
            schedule: '2026-12-31T09:00:00Z',
        } });
        expect(sent().url).toBe('https://v2.1saas.co/operator/scheduler/add');
        expect(sent().body).toEqual({
            sendToWebhook: 'https://hook.test/a',
            data: '{"a":1}',
            intervalType: 1,
            intervalOptions: '2026-12-31T09:00:00Z',
        });
        expect(result).toEqual({ task_id: 't1', next_execution: '2026-12-31T09:00:00.000Z', end_date: null });
    });

    it('Create parses timestamps, date lists, cron and period schedules', async () => {
        const cases: [string, string, unknown][] = [
            ['1', '1798707600', 1798707600],
            ['2', '1798707600, 1798794000', [1798707600, 1798794000]],
            ['2', '2026-12-31T09:00:00Z,\n2027-01-01T09:00:00Z', ['2026-12-31T09:00:00Z', '2027-01-01T09:00:00Z']],
            ['3', ' 0 9 * * 1 ', '0 9 * * 1'],
            ['4', 'days;2', 'days;2'],
        ];
        for (const [index, [intervalType, schedule, expected]] of cases.entries()) {
            respond({ taskId: 't', nextExecution: 'x' });
            await runAction({ action: createASchedulerAction, propsValue: {
                sendToWebhook: 'https://hook.test',
                intervalType,
                schedule,
                endDate: '2027-06-01T00:00:00Z',
            } });
            expect(sent(index).body.intervalOptions).toEqual(expected);
            expect(sent(index).body.intervalType).toBe(Number(intervalType));
            expect(sent(index).body.data).toBe('{}');
            expect(sent(index).body.endDate).toBe('2027-06-01T00:00:00Z');
        }
    });

    it('Create rejects an empty schedule', async () => {
        await expect(
            runAction({ action: createASchedulerAction, propsValue: { sendToWebhook: 'https://hook.test', intervalType: '3', schedule: ' ' } }),
        ).rejects.toThrow('Enter a Schedule');
        expect(sendRequest).not.toHaveBeenCalled();
    });

    it('Delete sends the task id', async () => {
        respond({ message: 'Task deleted.' });
        const result = await runAction({ action: deleteASchedulerAction, propsValue: { taskId: 't1' } });
        expect(sent().url).toBe('https://v2.1saas.co/operator/scheduler/del');
        expect(sent().body).toEqual({ taskId: 't1' });
        expect(result).toEqual({ deleted: true, task_id: 't1', message: 'Task deleted.' });
    });

    it('List maps tasks', async () => {
        respond({ tasks: [{ taskId: 't1', webhook: 'https://hook.test', nextExecution: 'n', data: '{}' }] });
        const result = await runAction({ action: listSchedulersAction, propsValue: {} });
        expect(sent().url).toBe('https://v2.1saas.co/operator/scheduler/list');
        expect(result).toEqual({
            count: 1,
            schedulers: [{ task_id: 't1', webhook: 'https://hook.test', next_execution: 'n', data: '{}' }],
        });
    });

    it('Scheduler dropdown lists tasks and reports errors', async () => {
        const taskIdDropdown = deleteASchedulerAction.props.taskId;
        respond({ tasks: [{ taskId: 't1', webhook: 'https://hook.test', nextExecution: 'n', data: '{}' }] });
        expect(await loadDropdownOptions({ dropdown: taskIdDropdown, auth: TEST_AUTH })).toEqual({
            disabled: false,
            options: [{ label: 'https://hook.test (next run n)', value: 't1' }],
        });
        respond({ tasks: [] });
        expect(await loadDropdownOptions({ dropdown: taskIdDropdown, auth: TEST_AUTH })).toMatchObject({ disabled: true });
        fail({ status: 401, body: { errorMessage: 'Invalid API key.' } });
        expect(await loadDropdownOptions({ dropdown: taskIdDropdown, auth: TEST_AUTH })).toMatchObject({
            disabled: true,
            placeholder: '0CodeKit returned 401: Invalid API key.',
        });
    });
});

type MetadataAction = {
    displayName: string;
    classification?: string;
    audience?: string;
    aiMetadata?: { description?: string; idempotent?: boolean };
};
