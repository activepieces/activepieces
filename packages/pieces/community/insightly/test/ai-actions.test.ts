import { AppConnectionType } from '@activepieces/core-piece-types';
import { HttpError, httpClient, HttpRequest, HttpResponse } from '@activepieces/pieces-common';
import { createMockActionContext, InputPropertyMap, PropertyContext, StaticPropsValue } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { insightlyUtils } from '../src/lib/common/client';
import { insightlyCommon } from '../src/lib/common/common';
import { insightlyDropdowns } from '../src/lib/common/dropdowns';
import { aiFindContacts } from '../src/lib/actions/ai/contacts';
import { aiCreateOpportunity, aiFindOpportunities } from '../src/lib/actions/ai/opportunities';
import { aiCreateTask, aiFindTasks } from '../src/lib/actions/ai/tasks';
import { aiFindPipelineStageByName, aiFindUser } from '../src/lib/actions/ai/resolvers';
import { aiSetCustomField } from '../src/lib/actions/ai/custom-fields';
import { deletedRecordInternals } from '../src/lib/triggers/deleted-record';

const AUTH: { type: AppConnectionType.SECRET_TEXT; secret_text: string } = { type: AppConnectionType.SECRET_TEXT, secret_text: 'key' };

const findContactsEmpty = { email: undefined, firstName: undefined, lastName: undefined, limit: undefined };
const findOpportunitiesEmpty = { name: undefined, state: undefined, limit: undefined };
const findTasksEmpty = { title: undefined, status: undefined, limit: undefined };
const createOpportunityEmpty = { name: undefined, value: undefined, currency: undefined, closeDate: undefined, probability: undefined, organisationId: undefined, pipelineId: undefined, stageId: undefined };
const findUserEmpty = { email: undefined, name: undefined };
const createTaskEmpty = { title: undefined, dueDate: undefined, details: undefined, priority: undefined, ownerUserId: undefined, responsibleUserId: undefined, linkObject: undefined, linkId: undefined };

function mockApi(route: (request: HttpRequest) => unknown) {
  const requests: HttpRequest[] = [];
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async <T,>(request: HttpRequest): Promise<HttpResponse<T>> => {
    requests.push(request);
    const path = request.url.replace(/^https:\/\/api\.[a-z0-9]+\.insightly\.com\/v3\.1/, '');
    const body = path === '/Instance' ? {} : route({ ...request, url: path });
    if (body instanceof HttpError) {
      throw body;
    }
    return { status: 200, headers: {}, body: toBody<T>(body) };
  });
  return requests;
}

function isJsonBody<T>(value: unknown): value is T {
  return value !== undefined;
}

function toBody<T>(value: unknown): T {
  const parsed: unknown = JSON.parse(JSON.stringify(value ?? null));
  if (!isJsonBody<T>(parsed)) {
    throw new Error('mock body is not JSON');
  }
  return parsed;
}

function notFound(): HttpError {
  return new HttpError({}, { status: 404, responseBody: { Message: 'Not found' } });
}

function actionContext<Props extends InputPropertyMap>(propsValue: StaticPropsValue<Props>) {
  const base = createMockActionContext<Props>({ propsValue });
  return { ...base, auth: AUTH };
}

function propertyContext(): PropertyContext {
  const base = createMockActionContext<InputPropertyMap>({ propsValue: {} });
  return { server: base.server, project: base.project, flows: base.flows, connections: base.connections };
}

beforeEach(() => {
  insightlyUtils.clearPodCache();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('recordIdOf uses the object type', () => {
  test('task with an opportunity link returns the task id', () => {
    expect(insightlyCommon.recordIdOf({ record: { OPPORTUNITY_ID: 9, TASK_ID: 5 }, objectName: 'Tasks' })).toBe('5');
  });

  test('quotation with a contact link returns the quotation id', () => {
    expect(insightlyCommon.recordIdOf({ record: { CONTACT_ID: 8, QUOTATION_ID: 3 }, objectName: 'Quotations' })).toBe('3');
  });

  test('record dropdown values are the object ids', async () => {
    mockApi(() => [{ OPPORTUNITY_ID: 9, PROJECT_ID: 4, TASK_ID: 5, TITLE: 'Call' }]);
    const dropdown = insightlyDropdowns.recordDropdown({ displayName: 'Record', description: 'x' });
    const state = await dropdown.options({ auth: AUTH, objectName: 'Tasks', pod: 'na1' }, propertyContext());
    expect(state.options).toEqual([{ label: 'Call (ID: 5)', value: 5 }]);
  });

  test('deleted poller tracks task ids, not link ids', () => {
    const { nextStored } = deletedRecordInternals.detectDeletions({ stored: {}, records: [{ TASK_ID: 5, OPPORTUNITY_ID: 9 }], nowMs: 0, objectType: 'Tasks' });
    expect(Object.keys(nextStored)).toEqual(['5']);
  });
});

describe('deleted poller store size', () => {
  test('throws instead of storing too many records', () => {
    const records = Array.from({ length: deletedRecordInternals.MAX_WATCHED_RECORDS + 1 }, (_, index) => ({ CONTACT_ID: index + 1 }));
    expect(() => deletedRecordInternals.detectDeletions({ stored: {}, records, nowMs: 0, objectType: 'Contacts' })).toThrow('Too many records to watch');
  });

  test('worst-case ASCII names at the record cap stay under the store limit', () => {
    const records = Array.from({ length: deletedRecordInternals.MAX_WATCHED_RECORDS }, (_, index) => ({
      CONTACT_ID: 100000000000000000 + index,
      FIRST_NAME: `${'"\\'.repeat(40)}${index}`,
      LAST_NAME: 'x'.repeat(80),
    }));
    const { nextStored } = deletedRecordInternals.detectDeletions({ stored: {}, records, nowMs: Date.UTC(2026, 10, 17), objectType: 'Contacts' });
    const bytes = Buffer.byteLength(JSON.stringify(nextStored), 'utf8');
    expect(bytes).toBeLessThanOrEqual(deletedRecordInternals.MAX_STORE_BYTES);
    expect(bytes).toBeLessThan(512 * 1024);
    expect(Object.values(nextStored).every(([, name]) => Array.from(name).length <= 60)).toBe(true);
  });

  test('multi-byte names that would exceed the store limit throw instead of writing', () => {
    const records = Array.from({ length: deletedRecordInternals.MAX_WATCHED_RECORDS }, (_, index) => ({ CONTACT_ID: index + 1, FIRST_NAME: '\u{1F600}'.repeat(60) }));
    expect(() => deletedRecordInternals.detectDeletions({ stored: {}, records, nowMs: 0, objectType: 'Contacts' })).toThrow('Too many records to watch');
  });

  test('keeps the real name for deleted records', () => {
    const { deleted } = deletedRecordInternals.detectDeletions({ stored: { '7': [0, 'Jane Roe'] }, records: [], nowMs: 60 * 60 * 1000, objectType: 'Contacts' });
    expect(deleted[0]).toMatchObject({ recordId: 7, recordName: 'Jane Roe' });
  });

  test('reads the legacy store formats', () => {
    expect(deletedRecordInternals.normalizeStored({ '1': { name: 'A', lastSeenMs: 120000 }, '2': [3, 'B'] })).toEqual({ '1': [2, 'A'], '2': [3, 'B'] });
  });
});

describe('find actions', () => {
  test('find contacts applies every filter and slices to the limit', async () => {
    mockApi(() => [
      { CONTACT_ID: 1, FIRST_NAME: 'Ann', LAST_NAME: 'Lee' },
      { CONTACT_ID: 2, FIRST_NAME: 'Bob', LAST_NAME: 'Lee' },
      { CONTACT_ID: 3, FIRST_NAME: 'ann', LAST_NAME: 'lee' },
      { CONTACT_ID: 4, FIRST_NAME: 'Ann', LAST_NAME: 'Leeds' },
    ]);
    const result = await aiFindContacts.run(actionContext<typeof aiFindContacts.props>({ ...findContactsEmpty, firstName: 'Ann', lastName: 'Lee', limit: 1 }));
    expect(result).toMatchObject({ hasMore: true, contacts: [{ id: 1 }] });
  });

  test('find opportunities filters state on name matches', async () => {
    mockApi(() => [
      { OPPORTUNITY_ID: 1, OPPORTUNITY_NAME: 'Deal', OPPORTUNITY_STATE: 'OPEN' },
      { OPPORTUNITY_ID: 2, OPPORTUNITY_NAME: 'Deal', OPPORTUNITY_STATE: 'WON' },
    ]);
    const result = await aiFindOpportunities.run(actionContext<typeof aiFindOpportunities.props>({ ...findOpportunitiesEmpty, name: 'deal', state: 'WON' }));
    expect(result).toMatchObject({ opportunities: [{ id: 2 }] });
  });

  test('find tasks filters status on title matches', async () => {
    mockApi(() => [
      { TASK_ID: 1, TITLE: 'Call', STATUS: 'COMPLETED' },
      { TASK_ID: 2, TITLE: 'Call', STATUS: 'NOT STARTED' },
      { TASK_ID: 3, TITLE: 'Call back', STATUS: 'NOT STARTED' },
    ]);
    const result = await aiFindTasks.run(actionContext<typeof aiFindTasks.props>({ ...findTasksEmpty, title: 'Call', status: 'NOT STARTED' }));
    expect(result).toMatchObject({ tasks: [{ id: 2 }] });
  });
});

describe('create opportunity', () => {
  test('requires pipeline and stage together', async () => {
    const requests = mockApi(() => ({}));
    await expect(aiCreateOpportunity.run(actionContext<typeof aiCreateOpportunity.props>({ ...createOpportunityEmpty, name: 'Deal', pipelineId: 1 }))).rejects.toThrow('both Pipeline ID and Stage ID');
    expect(requests).toHaveLength(0);
  });

  test('rejects a stage from another pipeline before creating', async () => {
    const requests = mockApi((request) => (request.url === '/PipelineStages/20' ? { STAGE_ID: 20, PIPELINE_ID: 99 } : {}));
    await expect(aiCreateOpportunity.run(actionContext<typeof aiCreateOpportunity.props>({ ...createOpportunityEmpty, name: 'Deal', pipelineId: 1, stageId: 20 }))).rejects.toThrow('does not belong');
    expect(requests.some((request) => request.method === 'POST')).toBe(false);
  });

  test('creates, moves to the stage and re-applies probability', async () => {
    const requests = mockApi((request) => {
      if (request.url === '/PipelineStages/20') return { STAGE_ID: 20, PIPELINE_ID: 1 };
      if (request.method === 'POST') return { OPPORTUNITY_ID: 7, OPPORTUNITY_NAME: 'Deal' };
      if (request.url === '/Opportunities/7') return { OPPORTUNITY_ID: 7, OPPORTUNITY_NAME: 'Deal', PIPELINE_ID: 1, STAGE_ID: 20, PROBABILITY: 40 };
      return {};
    });
    const result = await aiCreateOpportunity.run(actionContext<typeof aiCreateOpportunity.props>({ ...createOpportunityEmpty, name: 'Deal', pipelineId: 1, stageId: 20, probability: 40 }));
    expect(result).toMatchObject({ id: 7, pipelineId: 1, stageId: 20, probability: 40 });
    const writes = requests.filter((request) => request.method !== 'GET').map((request) => `${request.method} ${request.url.replace(/^https:\/\/api\.na1\.insightly\.com\/v3\.1/, '')}`);
    expect(writes).toEqual(['POST /Opportunities', 'PUT /Opportunities/7/PipelineStage', 'PUT /Opportunities']);
  });

  test('stage failure after create names the opportunity id', async () => {
    mockApi((request) => {
      if (request.url === '/PipelineStages/20') return { STAGE_ID: 20, PIPELINE_ID: 1 };
      if (request.method === 'POST') return { OPPORTUNITY_ID: 7 };
      if (request.method === 'PUT') return new HttpError({}, { status: 500, responseBody: { Message: 'boom' } });
      return { OPPORTUNITY_ID: 7, PIPELINE_ID: 1 };
    });
    await expect(aiCreateOpportunity.run(actionContext<typeof aiCreateOpportunity.props>({ ...createOpportunityEmpty, name: 'Deal', pipelineId: 1, stageId: 20 }))).rejects.toThrow('Opportunity 7 was created');
  });

  test('throws when create returns no id but a stage was requested', async () => {
    mockApi((request) => (request.url === '/PipelineStages/20' ? { STAGE_ID: 20, PIPELINE_ID: 1 } : {}));
    await expect(aiCreateOpportunity.run(actionContext<typeof aiCreateOpportunity.props>({ ...createOpportunityEmpty, name: 'Deal', pipelineId: 1, stageId: 20 }))).rejects.toThrow('returned no ID');
  });
});

describe('exact resolvers', () => {
  test('pipeline stage lookup fails on duplicate pipeline names', async () => {
    mockApi((request) =>
      request.url === '/Pipelines'
        ? [{ PIPELINE_ID: 1, PIPELINE_NAME: 'Sales' }, { PIPELINE_ID: 2, PIPELINE_NAME: 'sales' }]
        : [{ STAGE_ID: 10, PIPELINE_ID: 1, STAGE_NAME: 'Won', STAGE_ORDER: 1 }],
    );
    await expect(
      aiFindPipelineStageByName.run(actionContext<typeof aiFindPipelineStageByName.props>({ objectType: 'Opportunities', pipelineName: 'Sales', stageName: 'Won' })),
    ).rejects.toThrow('More than one pipeline');
  });

  test('find user fails listing candidates when names collide', async () => {
    mockApi(() => [
      { USER_ID: 1, FIRST_NAME: 'Sam', LAST_NAME: 'Fox', EMAIL_ADDRESS: 'a@x.co' },
      { USER_ID: 2, FIRST_NAME: 'Sam', LAST_NAME: 'Fox', EMAIL_ADDRESS: 'b@x.co' },
    ]);
    await expect(aiFindUser.run(actionContext<typeof aiFindUser.props>({ ...findUserEmpty, name: 'sam fox' }))).rejects.toThrow(/a@x\.co.*b@x\.co/);
  });
});

describe('set custom field', () => {
  test('rejects unknown names and lists valid ones without writing', async () => {
    const requests = mockApi(() => [{ FIELD_NAME: 'Industry__c' }, { FIELD_NAME: 'Tier__c' }]);
    await expect(
      aiSetCustomField.run(actionContext<typeof aiSetCustomField.props>({ objectType: 'Contacts', recordId: 5, fieldName: 'Nope__c', value: 'x' })),
    ).rejects.toThrow('Valid fields: Industry__c, Tier__c');
    expect(requests.some((request) => request.method === 'PUT')).toBe(false);
  });
});

describe('create task links', () => {
  test('requires link type and id together', async () => {
    const requests = mockApi(() => ({}));
    await expect(aiCreateTask.run(actionContext<typeof aiCreateTask.props>({ ...createTaskEmpty, title: 'Call', linkObject: 'Contact' }))).rejects.toThrow('or neither');
    expect(requests).toHaveLength(0);
  });

  test('checks the link target exists before creating the task', async () => {
    const requests = mockApi((request) => (request.url === '/Contacts/42' ? notFound() : {}));
    await expect(aiCreateTask.run(actionContext<typeof aiCreateTask.props>({ ...createTaskEmpty, title: 'Call', linkObject: 'Contact', linkId: 42, ownerUserId: 1 }))).rejects.toThrow('404');
    expect(requests.some((request) => request.method === 'POST')).toBe(false);
  });

  test('link failure after create names the task id', async () => {
    mockApi((request) => {
      if (request.url === '/Tasks') return { TASK_ID: 11, TITLE: 'Call' };
      if (request.url === '/Tasks/11/Links') return new HttpError({}, { status: 400, responseBody: { Message: 'bad link' } });
      return { CONTACT_ID: 42 };
    });
    await expect(aiCreateTask.run(actionContext<typeof aiCreateTask.props>({ ...createTaskEmpty, title: 'Call', linkObject: 'Contact', linkId: 42, ownerUserId: 1 }))).rejects.toThrow('Task 11 was created');
  });
});
