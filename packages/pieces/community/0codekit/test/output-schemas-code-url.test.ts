import { OutputSchema } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runJavascriptCodeAction } from '../src/lib/actions/code/run-javascript-code';
import { runPythonCodeAction } from '../src/lib/actions/code/run-python-code';
import { cryptoDecryptAction } from '../src/lib/actions/crypto/crypto-decrypt';
import { cryptoEncryptAction } from '../src/lib/actions/crypto/crypto-encrypt';
import { cryptoHashAction } from '../src/lib/actions/crypto/crypto-hash';
import { createASchedulerAction } from '../src/lib/actions/scheduler/create-a-scheduler';
import { deleteASchedulerAction } from '../src/lib/actions/scheduler/delete-a-scheduler';
import { listSchedulersAction } from '../src/lib/actions/scheduler/list-schedulers';
import { advancedSwitchWithUrlAction } from '../src/lib/actions/url/advanced-switch-with-url';
import { createCustomShortenedUrlAction } from '../src/lib/actions/url/create-custom-shortened-url';
import { createShortenedUrlAction } from '../src/lib/actions/url/create-shortened-url';
import { deleteShortenedUrlAction } from '../src/lib/actions/url/delete-shortened-url';
import { getAShortenedUrlAction } from '../src/lib/actions/url/get-a-shortened-url';
import { listShortenedUrlsAction } from '../src/lib/actions/url/list-shortened-urls';
import { updateShortenedUrlAction } from '../src/lib/actions/url/update-shortened-url';
import { urlExpanderAction } from '../src/lib/actions/url/url-expander';
import { utmBuildAction } from '../src/lib/actions/url/utm-build';
import { utmParseAction } from '../src/lib/actions/url/utm-parse';
import { runAction, TestAction } from './helpers';

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

const SHORT_URL = { identifier: 'a1', createdAt: '2026-09-27T20:09:41.222Z', destination: 'https://a.com' };
const TASK = { taskId: 't1', webhook: 'https://hook.test', nextExecution: '2030-01-01T00:00:00.000Z', data: '{}' };

const cases: SchemaCase[] = [
    {
        name: 'Run Javascript Code',
        action: runJavascriptCodeAction,
        body: { total: 3 },
        props: { code: 'return { total: 3 };' },
    },
    {
        name: 'Run Python Code',
        action: runPythonCodeAction,
        body: { result: { sum: 5 } },
        props: { code: 'result = {"sum": 5}' },
    },
    {
        name: 'Crypto Encrypt',
        action: cryptoEncryptAction,
        body: { encryptedText: 'U2FsdGVk' },
        props: { cryptoType: 'AES', message: 'hi', secretKey: 'k' },
    },
    {
        name: 'Crypto Decrypt',
        action: cryptoDecryptAction,
        body: { decryptedText: 'hi' },
        props: { cryptoType: 'AES', ciphertext: 'U2FsdGVk', secretKey: 'k' },
    },
    {
        name: 'Crypto Hash',
        action: cryptoHashAction,
        body: { hashedText: 'abc' },
        props: { hashType: 'SHA256', message: 'hi' },
    },
    {
        name: 'Create a Scheduler',
        action: createASchedulerAction,
        body: { taskId: 't1', nextExecution: '2030-01-01T00:00:00.000Z' },
        props: { sendToWebhook: 'https://hook.test', intervalType: '3', schedule: '0 9 * * *' },
    },
    {
        name: 'List Schedulers',
        action: listSchedulersAction,
        body: { tasks: [TASK] },
        props: {},
        list: 'schedulers',
    },
    {
        name: 'Delete a Scheduler',
        action: deleteASchedulerAction,
        body: { message: 'Task deleted.' },
        props: { taskId: 't1' },
    },
    {
        name: 'Create Shortened Url',
        action: createShortenedUrlAction,
        body: { shortenedUrl: 'https://lyl.ai/a1', identifier: 'a1' },
        props: { destination: 'https://a.com' },
    },
    {
        name: 'Create Custom Shortened Url',
        action: createCustomShortenedUrlAction,
        body: { shortenedUrl: 'https://lyl.ai/summer', identifier: 'summer' },
        props: { destination: 'https://a.com', custom: 'summer' },
    },
    {
        name: 'Get a Shortened Url',
        action: getAShortenedUrlAction,
        body: { destination: 'https://a.com' },
        props: { identifier: 'a1' },
    },
    {
        name: 'Update Shortened Url',
        action: updateShortenedUrlAction,
        body: { newDestination: 'https://b.com', identifier: 'a1' },
        props: { identifier: 'a1', destination: 'https://b.com' },
    },
    {
        name: 'List Shortened Urls',
        action: listShortenedUrlsAction,
        body: { shortenedUrls: [SHORT_URL] },
        props: {},
        list: 'shortened_urls',
    },
    {
        name: 'Delete Shortened Url',
        action: deleteShortenedUrlAction,
        body: { message: 'Successfully deleted shortened URL with id a1.' },
        props: { identifier: 'a1' },
    },
    {
        name: 'URL Expander',
        action: urlExpanderAction,
        body: { unshortenedUrl: 'https://example.com/long/page' },
        props: { url: 'https://lyl.ai/a1' },
    },
    {
        name: 'UTM Build',
        action: utmBuildAction,
        body: { url: 'https://example.com/?utm_source=news' },
        props: { url: 'https://example.com', utmSource: 'news' },
    },
    {
        name: 'UTM Parse',
        action: utmParseAction,
        body: { utm_source: 'news', utm_medium: 'email' },
        props: { url: 'https://example.com/?utm_source=news&utm_medium=email' },
    },
    {
        name: 'Advanced Switch with URL',
        action: advancedSwitchWithUrlAction,
        body: { found: ['Germany', 'France'] },
        props: { jsonUrl: 'https://example.com/map.json', keys: ['de', 'fr'] },
    },
];

beforeEach(() => {
    sendRequest.mockReset();
});

describe('code, crypto, scheduler and url output schemas', () => {
    it.each(cases)('$name output schema matches the run() output keys', async ({ action, body, props, list }) => {
        sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body });
        const result = await runAction({ action, propsValue: props });
        const schema = action.outputSchema;
        expect(schema).toBeDefined();
        expect(fieldKeys(schema?.fields)).toEqual(objectKeys(result));
        if (list !== undefined) {
            const listField = schema?.fields.find((field) => field.key === list);
            expect(listField?.labelKey).toBeDefined();
            expect(fieldKeys(listField?.listItems)).toEqual(objectKeys(firstItem({ result, key: list })));
        }
    });

    it('every schema field value path is the key itself', () => {
        const paths = cases.flatMap(({ action }) => action.outputSchema?.fields ?? []).filter((field) => field.value !== undefined);
        expect(paths).toEqual([]);
    });

    it.each([
        ['Run Javascript Code', runJavascriptCodeAction],
        ['Run Python Code', runPythonCodeAction],
    ])('%s output schema has a single top-level result field', (_name, action) => {
        expect(fieldKeys(action.outputSchema?.fields)).toEqual(['result']);
    });
});

function fieldKeys(fields: OutputSchema['fields'] | undefined): string[] {
    return (fields ?? []).map((field) => field.key).sort();
}

function objectKeys(value: unknown): string[] {
    if (value === null || typeof value !== 'object') {
        return [];
    }
    return Object.keys(value).sort();
}

function firstItem({ result, key }: { result: unknown; key: string }): unknown {
    if (result === null || typeof result !== 'object' || !(key in result)) {
        return undefined;
    }
    const items: unknown = Reflect.get(result, key);
    return Array.isArray(items) ? items[0] : undefined;
}

type SchemaCase = {
    name: string;
    action: SchemaAction;
    body: unknown;
    props: Record<string, unknown>;
    list?: string;
};

type SchemaAction = TestAction & {
    outputSchema?: OutputSchema;
};
