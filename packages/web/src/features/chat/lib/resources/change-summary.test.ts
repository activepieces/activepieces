import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'current-project' },
}));

import { ToolCallRecord, changeSummaryUtils } from './change-summary';

const text = (value: string) => ({ content: [{ type: 'text', text: value }] });

const call = (
  toolName: string,
  input: Record<string, unknown>,
  output: unknown,
  extra: Partial<ToolCallRecord> = {},
): ToolCallRecord => ({
  toolCallId: null,
  toolName,
  input,
  output,
  state: 'output-available',
  ...extra,
});

const rows = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ Name: `n${index}` }));

describe('changeSummaryUtils.summarize', () => {
  it('returns nothing for read-only or unknown tools', () => {
    expect(
      changeSummaryUtils.summarize([
        call('ap_list_tables', {}, text('Leads (id: t1)')),
        call('ap_test_flow', { flowId: 'f1' }, text('✅ ran')),
      ]),
    ).toEqual([]);
  });

  it('counts rows added on one line per resource', () => {
    const [line] = changeSummaryUtils.summarize([
      call(
        'ap_insert_records',
        { tableId: 't1', records: rows(2) },
        text('✅ Inserted 2 record(s). IDs: a, b'),
      ),
      call(
        'ap_insert_records',
        { tableId: 't1', records: rows(4) },
        text('✅ Inserted 4 record(s). IDs: c, d, e, f'),
      ),
    ]);
    expect(line.state).toBe('applied');
    expect(line.facts.rowsAdded).toBe(6);
    expect(line.facts.rowsRequested).toBe(6);
  });

  it('marks a short insert as partial', () => {
    const [line] = changeSummaryUtils.summarize([
      call(
        'ap_insert_records',
        { tableId: 't1', records: rows(6) },
        text('⚠️ Inserted 4 of 6 record(s).'),
      ),
    ]);
    expect(line.state).toBe('partial');
    expect(line.facts.rowsAdded).toBe(4);
    expect(line.facts.rowsRequested).toBe(6);
  });

  it.each([
    [
      'declined',
      text('The user declined this delete. Do not retry it.'),
      'declined',
    ],
    ['failed', text('❌ Flow not found'), 'failed'],
    ['forbidden', text('❌ Permission denied: nope'), 'forbidden'],
  ])('keeps a %s call as its own state', (_label, output, state) => {
    const [line] = changeSummaryUtils.summarize([
      call('ap_delete_records', { tableId: 't1', recordIds: ['r1'] }, output),
    ]);
    expect(line.state).toBe(state);
  });

  it('treats tool errors and denials as not applied', () => {
    const lines = changeSummaryUtils.summarize([
      call('ap_update_record', { tableId: 't1', recordId: 'r1' }, 'boom', {
        state: 'output-error',
      }),
      call('ap_update_record', { tableId: 't2', recordId: 'r1' }, undefined, {
        state: 'output-denied',
      }),
    ]);
    expect(lines.map((line) => line.state)).toEqual(['failed', 'declined']);
  });

  it('is partial when some calls on a resource failed', () => {
    const [line] = changeSummaryUtils.summarize([
      call('ap_add_step', { flowId: 'f1' }, text('✅ Added step')),
      call('ap_update_step', { flowId: 'f1' }, text('❌ invalid')),
    ]);
    expect(line.state).toBe('partial');
    expect(line.facts.stepsAdded).toBe(1);
  });

  it('flags flows edited but not published as drafts', () => {
    const [edited] = changeSummaryUtils.summarize([
      call('ap_add_step', { flowId: 'f1' }, text('✅ Added step')),
    ]);
    expect(edited.draft).toBe(true);
    const [published] = changeSummaryUtils.summarize([
      call('ap_add_step', { flowId: 'f1' }, text('✅ Added step')),
      call('ap_lock_and_publish', { flowId: 'f1' }, text('✅ published')),
    ]);
    expect(published.draft).toBe(false);
    expect(published.facts.published).toBe(true);
  });

  it('reads the project and step count of a built flow', () => {
    const [line] = changeSummaryUtils.summarize([
      call(
        'ap_build_flow',
        { flowName: 'Sync' },
        {
          structuredContent: {
            flowId: 'f9',
            flowUrl: '/projects/other/flows/f9',
          },
          content: [
            { type: 'text', text: '✅ Flow "Sync" created with 3 steps' },
          ],
        },
      ),
    ]);
    expect(line.ref).toEqual({
      kind: 'flow',
      id: 'f9',
      projectId: 'other',
      name: 'Sync',
    });
    expect(line.facts.created).toBe(true);
    expect(line.facts.stepsAdded).toBe(3);
  });

  it('counts each tool call once', () => {
    const insert = call(
      'ap_insert_records',
      { tableId: 't1', records: rows(1) },
      text('✅ Inserted 1 record(s). IDs: a'),
      { toolCallId: 'c1' },
    );
    const [line] = changeSummaryUtils.summarize([insert, insert]);
    expect(line.facts.rowsAdded).toBe(1);
  });

  it('skips calls held back by a question', () => {
    expect(
      changeSummaryUtils.summarize([
        call(
          'ap_add_step',
          { flowId: 'f1' },
          text('Not run: you asked the user a question'),
        ),
      ]),
    ).toEqual([]);
  });
});

describe('changeSummaryUtils.fromToolParts', () => {
  it('reads finished tool parts only', () => {
    const records = changeSummaryUtils.fromToolParts([
      { type: 'text', text: 'hi' },
      {
        type: 'tool-ap_add_step',
        toolCallId: 'a',
        state: 'input-available',
        input: {},
      },
      {
        type: 'dynamic-tool',
        toolName: 'ap_add_step',
        toolCallId: 'b',
        state: 'output-available',
        input: { flowId: 'f1' },
        output: 'ok',
      },
      {
        type: 'tool-ap_update_step',
        toolCallId: 'c',
        state: 'output-error',
        input: { flowId: 'f1' },
        errorText: 'boom',
      },
    ]);
    expect(records.map((record) => [record.toolName, record.state])).toEqual([
      ['ap_add_step', 'output-available'],
      ['ap_update_step', 'output-error'],
    ]);
  });
});
