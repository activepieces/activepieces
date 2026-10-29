import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createMockActionContext, InputPropertyMap } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { aiUpdateBoxAction } from '../src/lib/actions/ai-update-box';
import { createTaskAction } from '../src/lib/actions/create-task';
import { findBoxAction } from '../src/lib/actions/find-box';
import { listBoxTasksAction } from '../src/lib/actions/list-box-tasks';
import { listBoxesAction } from '../src/lib/actions/list-boxes';
import { listPipelineFieldsAction } from '../src/lib/actions/list-pipeline-fields';
import { listPipelinesAction } from '../src/lib/actions/list-pipelines';
import { listStagesAction } from '../src/lib/actions/list-stages';
import { listTeamsAction } from '../src/lib/actions/list-teams';
import { updateBoxAction } from '../src/lib/actions/update-box';
import { streak } from '../src/index';

const AUTH = { secret_text: 'key123' };
const BASE = 'https://api.streak.com';

function run({ action, propsValue }: { action: { run: unknown }; propsValue: Record<string, unknown> }): Promise<unknown> {
  const base = createMockActionContext<InputPropertyMap>({ propsValue: {} });
  const runFn = action.run;
  if (typeof runFn !== 'function') {
    throw new Error('action has no run');
  }
  return Promise.resolve(Reflect.apply(runFn, action, [{ ...base, propsValue, auth: AUTH }]));
}

function mockResponses(bodies: unknown[]) {
  const spy = vi.spyOn(httpClient, 'sendRequest');
  for (const body of bodies) {
    spy.mockResolvedValueOnce({ status: 200, headers: {}, body });
  }
  return spy;
}

function callAt({ spy, index }: { spy: ReturnType<typeof mockResponses>; index: number }) {
  return spy.mock.calls[index][0];
}

const BOX = {
  boxKey: 'box1',
  key: 'box1',
  name: 'Acme',
  pipelineKey: 'pipe1',
  stageKey: '5001',
  fields: { '1001': 'Closed' },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('update_box', () => {
  it('writes custom fields one call per field through the fields endpoint, not in the box body', async () => {
    const spy = mockResponses([BOX, {}, {}, BOX]);
    const out = await run({
      action: updateBoxAction,
      propsValue: { boxKey: 'box1', name: 'New', fields: { '1001': 'Closed', '1002': 42 } },
    });
    expect(spy).toHaveBeenCalledTimes(4);
    expect(callAt({ spy, index: 0 })).toMatchObject({ method: HttpMethod.POST, url: `${BASE}/api/v1/boxes/box1`, body: { name: 'New' } });
    expect(callAt({ spy, index: 0 }).body).not.toHaveProperty('fields');
    expect(callAt({ spy, index: 1 })).toMatchObject({ method: HttpMethod.POST, url: `${BASE}/api/v1/boxes/box1/fields/1001`, body: { value: 'Closed' } });
    expect(callAt({ spy, index: 2 })).toMatchObject({ url: `${BASE}/api/v1/boxes/box1/fields/1002`, body: { value: 42 } });
    expect(callAt({ spy, index: 3 })).toMatchObject({ method: HttpMethod.GET, url: `${BASE}/api/v1/boxes/box1` });
    expect(out).toMatchObject({ box_key: 'box1', fields_json: '{"1001":"Closed"}' });
  });

  it('skips the box POST when only custom fields change', async () => {
    const spy = mockResponses([{}, BOX]);
    await run({ action: updateBoxAction, propsValue: { boxKey: 'box1', fields: { '1001': 'x' } } });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(callAt({ spy, index: 0 }).url).toBe(`${BASE}/api/v1/boxes/box1/fields/1001`);
  });

  it('is human-only', () => {
    expect(updateBoxAction.audience).toBe('human');
  });
});

describe('ai_update_box', () => {
  const FIELDS = [
    { key: '1001', name: 'Status', type: 'TEXT_INPUT' },
    { key: '1002', name: 'Amount', type: 'NUMBER' },
    { key: '1003', name: 'Close Date', type: 'DATE' },
    { key: '1004', name: 'Won', type: 'CHECKBOX' },
  ];

  it('coerces values by field type and writes each field separately', async () => {
    const spy = mockResponses([BOX, FIELDS, {}, {}, {}, {}, {}, BOX]);
    await run({
      action: aiUpdateBoxAction,
      propsValue: {
        box_key: ' box1 ',
        clear_notes: true,
        stage_key: '5002',
        field_updates: [
          { field_key: '1001', value: '00123' },
          { field_key: '1002', value: '42.5' },
          { field_key: '1003', value: '2026-01-02T00:00:00Z' },
          { field_key: '1004', value: 'true' },
        ],
      },
    });
    expect(callAt({ spy, index: 1 }).url).toBe(`${BASE}/api/v1/pipelines/pipe1/fields`);
    expect(callAt({ spy, index: 2 })).toMatchObject({ url: `${BASE}/api/v1/boxes/box1`, body: { notes: '', stageKey: '5002' } });
    expect(callAt({ spy, index: 3 }).body).toEqual({ value: '00123' });
    expect(callAt({ spy, index: 4 }).body).toEqual({ value: 42.5 });
    expect(callAt({ spy, index: 5 }).body).toEqual({ value: Date.parse('2026-01-02T00:00:00Z') });
    expect(callAt({ spy, index: 6 }).body).toEqual({ value: true });
    expect(callAt({ spy, index: 7 }).method).toBe(HttpMethod.GET);
  });

  it('rejects unknown field keys before writing anything', async () => {
    const spy = mockResponses([BOX, FIELDS]);
    await expect(
      run({ action: aiUpdateBoxAction, propsValue: { box_key: 'box1', name: 'X', field_updates: [{ field_key: '9999', value: 'a' }] } }),
    ).rejects.toThrow('9999');
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('rejects a non-numeric value for a number field', async () => {
    mockResponses([BOX, FIELDS]);
    await expect(
      run({ action: aiUpdateBoxAction, propsValue: { box_key: 'box1', field_updates: [{ field_key: '1002', value: 'lots' }] } }),
    ).rejects.toThrow('number');
  });
});

describe('discovery actions', () => {
  it('list_pipelines maps keys and counts', async () => {
    mockResponses([[{ key: 'k', pipelineKey: 'pipe1', name: 'Sales', stageOrder: ['1', '2'], fields: [{ key: 'f', name: 'F' }] }]]);
    const out = await run({ action: listPipelinesAction, propsValue: {} });
    expect(out).toEqual([
      expect.objectContaining({ pipeline_key: 'pipe1', name: 'Sales', stage_count: 2, field_count: 1 }),
    ]);
  });

  it('list_stages turns the stage map into an array', async () => {
    const spy = mockResponses([{ '5001': { key: '5001', name: 'Lead' }, '5002': { key: '5002', name: 'Won' } }]);
    const out = await run({ action: listStagesAction, propsValue: { pipeline_key: 'pipe1' } });
    expect(callAt({ spy, index: 0 }).url).toBe(`${BASE}/api/v1/pipelines/pipe1/stages`);
    expect(out).toEqual([{ stage_key: '5001', name: 'Lead' }, { stage_key: '5002', name: 'Won' }]);
  });

  it('list_boxes clamps limit and sends paging params', async () => {
    const spy = mockResponses([[BOX]]);
    const out = await run({ action: listBoxesAction, propsValue: { pipeline_key: 'pipe1', limit: 5000, page: 2 } });
    expect(callAt({ spy, index: 0 }).queryParams).toEqual({ sortBy: 'lastUpdatedTimestamp', limit: '200', page: '2' });
    expect(out).toEqual([expect.objectContaining({ box_key: 'box1' })]);
  });

  it('list_teams maps results', async () => {
    mockResponses([{ results: [{ key: 't1', name: 'Team' }] }]);
    expect(await run({ action: listTeamsAction, propsValue: {} })).toEqual([{ team_key: 't1', name: 'Team' }]);
  });

  it('list_pipeline_fields includes dropdown options', async () => {
    mockResponses([[{ key: '1001', name: 'Stage', type: 'DROPDOWN', dropdownSettings: { items: [{ key: '9001', name: 'Hot' }] } }]]);
    const out = await run({ action: listPipelineFieldsAction, propsValue: { pipeline_key: 'pipe1' } });
    expect(out).toEqual([{ field_key: '1001', name: 'Stage', type: 'DROPDOWN', dropdown_options: [{ key: '9001', name: 'Hot' }] }]);
  });

  it('list_box_tasks accepts both array and results-wrapped bodies', async () => {
    mockResponses([{ results: [{ key: 't1', text: 'Call' }] }, [{ key: 't2', text: 'Email' }]]);
    const a = await run({ action: listBoxTasksAction, propsValue: { box_key: 'box1' } });
    const b = await run({ action: listBoxTasksAction, propsValue: { box_key: 'box1' } });
    expect(a).toEqual([expect.objectContaining({ task_key: 't1', box_key: 'box1' })]);
    expect(b).toEqual([expect.objectContaining({ task_key: 't2', text: 'Email' })]);
  });
});

describe('existing actions', () => {
  it('find_box passes the pipeline filter', async () => {
    const spy = mockResponses([{ results: { boxes: [{ boxKey: 'b', name: 'n' }] } }]);
    await run({ action: findBoxAction, propsValue: { query: 'acme', pipelineKey: 'pipe1' } });
    expect(callAt({ spy, index: 0 }).queryParams).toEqual({ query: 'acme', pipelineKey: 'pipe1' });
  });

  it('create_task drops non-string assignees', async () => {
    const spy = mockResponses([{ key: 't1', text: 'x' }]);
    await run({ action: createTaskAction, propsValue: { boxKey: 'box1', text: 'x', assignedToEmails: ['a@b.com', 3, ''] } });
    expect(callAt({ spy, index: 0 }).body).toMatchObject({ assignedToSharingEntries: [{ email: 'a@b.com' }] });
  });
});

describe('piece metadata', () => {
  it('every action except custom API call has an outputSchema and ai/both actions have aiMetadata', () => {
    for (const [name, action] of Object.entries(streak.actions())) {
      if (name === 'custom_api_call') continue;
      expect(action.outputSchema, name).toBeDefined();
      if (action.audience !== 'human') {
        expect(action.aiMetadata?.idempotent, name).toBeTypeOf('boolean');
      }
    }
  });

  it('new list actions are SEARCH and ai-only', () => {
    for (const action of [listPipelinesAction, listStagesAction, listBoxesAction, listTeamsAction, listPipelineFieldsAction, listBoxTasksAction]) {
      expect(action.classification).toBe('SEARCH');
      expect(action.audience).toBe('ai');
    }
  });
});
