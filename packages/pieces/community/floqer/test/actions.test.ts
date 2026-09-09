import { HttpError } from '@activepieces/pieces-common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { floqerApi } from '../src/lib/common/client';
import { addRowsAction } from '../src/lib/actions/add-rows';
import { runRowsAction } from '../src/lib/actions/run-rows';
import { runShortcutAction } from '../src/lib/actions/run-shortcut';

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

const AUTH = { type: 'SECRET_TEXT', secret_text: 'floq_test' };

function envelope(data: unknown, extra: Record<string, unknown> = {}) {
    return { body: { status: 200, data, ...extra } };
}

function runAddRows(propsValue: Record<string, unknown>) {
    return addRowsAction.run({ auth: AUTH, propsValue } as never);
}

function runRunRows(propsValue: Record<string, unknown>) {
    return runRowsAction.run({ auth: AUTH, propsValue } as never);
}

const BASE_ROWS = { workflowId: 'w1', sheetId: 's1' };

beforeEach(() => {
    sendRequest.mockReset();
});

describe('Add Rows', () => {
    it('defaults run_after_add to none rather than an expensive mode', async () => {
        sendRequest.mockResolvedValueOnce(envelope({ row_count: 1, row_ids: ['r1'], rejected: [], rows_queued_for_run: 0 }));

        await runAddRows({ ...BASE_ROWS, rows: [{ email: 'a@b.com' }] });

        expect(sendRequest.mock.calls[0][0].body.run_after_add).toBe('none');
    });

    it('rejects an empty batch before calling Floqer', async () => {
        await expect(runAddRows({ ...BASE_ROWS, rows: [] })).rejects.toThrow(/at least one row/);
        expect(sendRequest).not.toHaveBeenCalled();
    });

    it('rejects more than 1000 rows in the piece, naming the limit', async () => {
        const rows = Array.from({ length: 1001 }, (_, i) => ({ n: i }));

        await expect(runAddRows({ ...BASE_ROWS, rows })).rejects.toThrow(/1000 rows per call/);
        expect(sendRequest).not.toHaveBeenCalled();
    });

    it('accepts exactly 1000 rows', async () => {
        sendRequest.mockResolvedValueOnce(envelope({ row_count: 1000, row_ids: [], rejected: [], rows_queued_for_run: 0 }));
        const rows = Array.from({ length: 1000 }, (_, i) => ({ n: i }));

        await runAddRows({ ...BASE_ROWS, rows });

        expect(sendRequest).toHaveBeenCalledTimes(1);
    });

    it('surfaces rejected rows so a partial import is visible', async () => {
        sendRequest.mockResolvedValueOnce(
            envelope({
                row_count: 1,
                row_ids: ['r1'],
                rejected: [{ row: { bad: 1 }, errors: [{ field: '_row', code: 'malformed_row', message: 'x' }] }],
                rows_queued_for_run: 0,
            }),
        );

        const result = await runAddRows({ ...BASE_ROWS, rows: [{ a: 1 }, { bad: 1 }] });

        expect(result.rejected).toHaveLength(1);
        expect(result.row_ids).toEqual(['r1']);
    });

    it('keeps warnings, which sit beside data in the envelope', async () => {
        sendRequest.mockResolvedValueOnce(
            envelope(
                { row_count: 2, row_ids: ['r1', 'r2'], rejected: [], rows_queued_for_run: 0 },
                { warnings: [{ field: 'email', code: 'duplicate_row', message: 'dupe' }] },
            ),
        );

        const result = await runAddRows({ ...BASE_ROWS, rows: [{ a: 1 }, { a: 1 }] });

        expect(result.warnings).toEqual([
            { field: 'email', code: 'duplicate_row', message: 'dupe' },
        ]);
    });

    it('defaults warnings to an empty list when the response omits them', async () => {
        sendRequest.mockResolvedValueOnce(envelope({ row_count: 1, row_ids: ['r1'], rejected: [], rows_queued_for_run: 0 }));

        const result = await runAddRows({ ...BASE_ROWS, rows: [{ a: 1 }] });

        expect(result.warnings).toEqual([]);
    });

    it('parses rows supplied as JSON strings', async () => {
        sendRequest.mockResolvedValueOnce(envelope({ row_count: 1, row_ids: ['r1'], rejected: [], rows_queued_for_run: 0 }));

        await runAddRows({ ...BASE_ROWS, rows: ['{"email":"a@b.com"}'] });

        expect(sendRequest.mock.calls[0][0].body.rows).toEqual([{ email: 'a@b.com' }]);
    });

    it('rejects a row that is not an object', async () => {
        await expect(runAddRows({ ...BASE_ROWS, rows: [[1, 2]] })).rejects.toThrow(/Row 1 is not an object/);
    });

    it('rejects a row string that is not valid JSON', async () => {
        await expect(runAddRows({ ...BASE_ROWS, rows: ['not json'] })).rejects.toThrow(/not valid JSON/);
    });
});

describe('Run Rows', () => {
    it('sends row_ids alone when specific rows are selected', async () => {
        sendRequest.mockResolvedValueOnce(envelope({ rows_queued: 2 }));

        await runRunRows({ ...BASE_ROWS, mode: 'row_ids', rowIds: ['a', 'b'] });

        expect(sendRequest.mock.calls[0][0].body).toEqual({ row_ids: ['a', 'b'] });
    });

    it('sends first_10 alone, never alongside row_ids', async () => {
        sendRequest.mockResolvedValueOnce(envelope({ rows_queued: 10 }));

        await runRunRows({ ...BASE_ROWS, mode: 'first_10', rowIds: ['a', 'b'] });

        expect(sendRequest.mock.calls[0][0].body).toEqual({ first_10: true });
    });

    it('rejects the neither case before calling Floqer', async () => {
        await expect(runRunRows({ ...BASE_ROWS, mode: 'row_ids', rowIds: [] })).rejects.toThrow(
            /at least one row ID/,
        );
        expect(sendRequest).not.toHaveBeenCalled();
    });

    it('treats blank row IDs as absent', async () => {
        await expect(
            runRunRows({ ...BASE_ROWS, mode: 'row_ids', rowIds: ['  ', ''] }),
        ).rejects.toThrow(/at least one row ID/);
    });
});

describe('Run Shortcut', () => {
    it('keys input_data by reference and drops empty values', async () => {
        sendRequest.mockResolvedValueOnce(envelope({ ok: true }));

        await runShortcutAction.run({
            auth: AUTH,
            propsValue: {
                shortcutId: 'sc1',
                inputData: { linkedin_url: 'https://x', note: '', missing: undefined },
            },
        } as never);

        expect(sendRequest.mock.calls[0][0].body).toEqual({
            input_data: { linkedin_url: 'https://x' },
        });
    });
});

describe('error extraction', () => {
    it('reads Floqer\'s documented {error:{code,message}} shape', () => {
        const e = new HttpError({}, {
            status: 400,
            responseBody: { error: { code: 'UNKNOWN_QUERY_PARAM', message: 'bad param' } },
        });

        expect(floqerApi.codeOf(e)).toBe('UNKNOWN_QUERY_PARAM');
        expect(floqerApi.messageOf(e)).toBe('bad param');
        expect(floqerApi.describe(e, 'fallback')).toBe('bad param (UNKNOWN_QUERY_PARAM)');
    });

    it('reads the shape Floqer actually returns for 403, where error is a string', () => {
        const e = new HttpError({}, {
            status: 403,
            responseBody: { status: 403, error: 'Forbidden', message: 'No ackDB connection found for the user' },
        });

        expect(floqerApi.messageOf(e)).toBe('No ackDB connection found for the user');
        expect(floqerApi.describe(e, 'fallback')).toBe('No ackDB connection found for the user');
    });

    it('falls back only when the body carries no message at all', () => {
        const e = new HttpError({}, { status: 500, responseBody: '' });

        expect(floqerApi.describe(e, 'fallback')).toBe('fallback');
    });

    it('reports the status for branching', () => {
        expect(floqerApi.statusOf(new HttpError({}, { status: 409, responseBody: {} }))).toBe(409);
        expect(floqerApi.statusOf(new Error('network'))).toBeUndefined();
    });
});
