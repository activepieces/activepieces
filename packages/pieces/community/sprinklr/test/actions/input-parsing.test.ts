import { httpClient, HttpRequest } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runReportAction } from '../../src/lib/actions/run-report';
import { searchCasesAction } from '../../src/lib/actions/search-cases';
import { sprinklrCase } from '../../src/lib/common/case';
import { sprinklrCaseWrite } from '../../src/lib/common/case-write';
import { pieceRunner, RunnableAction, shape } from '../support/piece-runner';

const AUTH = {
  access_token: 'token-1',
  client_id: 'key-1',
  props: { base: 'https://api3.sprinklr.com', callback: 'https://cloud.activepieces.com/redirect' },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('inputs mapped as JSON text', () => {
  it('reads an ID list given as a JSON array string', () => {
    expect(sprinklrCaseWrite.parseIdList({ value: '["101", 102]', field: 'Add Queue IDs' })).toEqual([101, 102]);
  });

  it('reads an ID list given as comma-separated text', () => {
    expect(sprinklrCaseWrite.parseIdList({ value: '101, 102', field: 'Add Queue IDs' })).toEqual([101, 102]);
  });

  it('drops an empty ID list instead of sending it', () => {
    expect(sprinklrCaseWrite.parseIdList({ value: [], field: 'Add Queue IDs' })).toBeUndefined();
    expect(sprinklrCaseWrite.parseIdList({ value: '[]', field: 'Add Queue IDs' })).toBeUndefined();
  });

  it('reads custom fields given as a JSON object string', () => {
    expect(sprinklrCaseWrite.customFieldsAsLists('{"spr_uc_type": "Complaint", "_c_1": ["a", "b"]}')).toEqual({
      spr_uc_type: ['Complaint'],
      _c_1: ['a', 'b'],
    });
  });

  it('names the field when the JSON text is broken', () => {
    expect(() => sprinklrCaseWrite.customFieldsAsLists('{"spr_uc_type": ')).toThrow('Custom Fields is not valid JSON');
  });

  it('turns Search Cases custom fields given as JSON text into filters', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce({ status: 200, headers: {}, body: { results: [], count: 0 } });
    await pieceRunner.runAction({ action: searchCasesAction, auth: AUTH, propsValue: { custom_fields: '{"spr_uc_type": "Complaint"}' } });
    const request: HttpRequest = spy.mock.calls[0][0];
    const filter = shape.record(shape.record(request.body)['filter']);
    expect(JSON.stringify(filter)).toContain('"key":"workflow.customProperties.spr_uc_type"');
  });

  it('refuses Search Cases custom fields that are not name and value pairs', async () => {
    vi.spyOn(httpClient, 'sendRequest');
    await expect(
      pieceRunner.runAction({ action: searchCasesAction, auth: AUTH, propsValue: { custom_fields: '["a"]' } }),
    ).rejects.toThrow('Custom Fields must be pairs');
  });
});

describe('run_report rows without headings', () => {
  it('keeps array rows as values instead of dropping them', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce({
      status: 200,
      headers: {},
      body: { data: { data: [['Queue A', 3]], hasMore: false }, errors: [] },
    });
    const action: RunnableAction = runReportAction;
    const out = shape.record(await pieceRunner.runAction({ action, auth: AUTH, propsValue: { payload: { report: 'CASE' } } }));
    expect(out['rows']).toEqual([{ values: ['Queue A', 3] }]);
    expect(out['rowCount']).toBe(1);
  });
});

describe('output schema times', () => {
  it('shows epoch-millisecond times and the case number as plain values', () => {
    const fields = (sprinklrCase.outputSchema.fields ?? []).filter(
      (field) => field.key.endsWith('Time') || field.key === 'dueDate' || field.key === 'caseNumber',
    );
    expect(fields.length).toBe(4);
    for (const field of fields) {
      expect(field.format).toBeUndefined();
    }
  });
});
