import * as http from 'http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
    AppConnectionType,
    AppConnectionValueForAuthProperty,
    createMockActionContext,
    createMockPollingTriggerContext,
} from '@activepieces/pieces-framework';
import { salesforce, salesforceAuth } from '../..';
import { newCaseCreatedTrigger } from './new-case-in-queue';

const QUEUE_ID = '00G5g000004XyZaEAK';
const USER_ID = '0055g00000AbCdEAAZ';
const CASE_ID = '5005g00000QwErTAAZ';

let historyRows: HistoryRow[] = [];
let baseUrl = '';

const server = http.createServer((req, res) => {
    const q = new URL(req.url ?? '/', 'http://localhost').searchParams.get('q') ?? '';
    const sinceMatch = /CreatedDate > (\S+)/.exec(q);
    const since = sinceMatch ? Date.parse(sinceMatch[1]) : 0;
    const records = /FROM CaseHistory/.test(q)
        ? historyRows.filter((r) => Date.parse(r.CreatedDate) > since)
        : /SELECT FIELDS\(ALL\) FROM Case WHERE Id IN/.test(q) && q.includes(CASE_ID)
            ? [{ Id: CASE_ID, OwnerId: QUEUE_ID, CreatedDate: '2026-01-01T00:00:00.000+0000' }]
            : [];
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ totalSize: records.length, done: true, records }));
});

beforeAll(async () => {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const address = server.address();
    if (address === null || typeof address === 'string') {
        throw new Error('fake Salesforce did not bind a port');
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(() => {
    server.close();
});

describe('New Case in Queue', () => {
    it('runs a Case that re-entered the queue between polls the same number of times whatever the CaseHistory row order', async () => {
        const oldestFirst = await countRunsForDoubleEntry({ newestFirst: false });
        const newestFirst = await countRunsForDoubleEntry({ newestFirst: true });
        expect(oldestFirst).toBe(1);
        expect(newestFirst).toBe(1);
    });
});

async function countRunsForDoubleEntry({ newestFirst }: { newestFirst: boolean }): Promise<number> {
    const trigger = salesforce.getTrigger('new_case');
    if (trigger === undefined) {
        throw new Error('new_case trigger not found');
    }
    const store = memoryStore();
    const auth: AppConnectionValueForAuthProperty<typeof salesforceAuth> = {
        type: AppConnectionType.OAUTH2,
        access_token: 'token',
        refresh_token: 'refresh',
        client_id: 'client',
        client_secret: 'secret',
        redirect_url: '',
        token_type: 'Bearer',
        token_url: '',
        scope: '',
        claimed_at: 0,
        data: { instance_url: baseUrl },
        props: { environment: 'login' },
    };
    const ctx = {
        ...createMockPollingTriggerContext<typeof newCaseCreatedTrigger.props>({ propsValue: { caseQueueId: QUEUE_ID } }),
        auth,
        store,
        files: createMockActionContext({ propsValue: {} }).files,
    };
    await trigger.onEnable(ctx);
    const t0 = await store.get<number>('lastPoll');
    if (t0 === null) {
        throw new Error('onEnable did not store lastPoll');
    }
    const rows = [
        { CaseId: CASE_ID, CreatedDate: sfDate(t0 + 60_000), NewValue: QUEUE_ID },
        { CaseId: CASE_ID, CreatedDate: sfDate(t0 + 90_000), NewValue: USER_ID },
        { CaseId: CASE_ID, CreatedDate: sfDate(t0 + 120_000), NewValue: QUEUE_ID },
    ];
    historyRows = newestFirst ? [...rows].reverse() : rows;
    const firstPoll = await trigger.run(ctx);
    const secondPoll = await trigger.run(ctx);
    return firstPoll.length + secondPoll.length;
}

function sfDate(ms: number): string {
    return new Date(ms).toISOString().replace('Z', '+0000');
}

function memoryStore() {
    const data = new Map<string, string>();
    return {
        async put<T>(key: string, value: T): Promise<T> {
            data.set(key, JSON.stringify(value));
            return value;
        },
        async get<T>(key: string): Promise<T | null> {
            const raw = data.get(key);
            return raw === undefined ? null : JSON.parse(raw);
        },
        async delete(key: string): Promise<void> {
            data.delete(key);
        },
    };
}

type HistoryRow = { CaseId: string; CreatedDate: string; NewValue: string };
