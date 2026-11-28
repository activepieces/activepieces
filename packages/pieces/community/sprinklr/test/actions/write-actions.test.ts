import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addCaseCommentAction } from '../../src/lib/actions/add-case-comment';
import { createCaseAction } from '../../src/lib/actions/create-case';
import { updateCaseAction } from '../../src/lib/actions/update-case';
import { sprinklrTiming } from '../../src/lib/common/client';
import { pieceRunner, RunnableAction } from '../support/piece-runner';

const AUTH = {
  access_token: 'token-1',
  client_id: 'key-1',
  props: { base: 'https://api3.sprinklr.com/prod2', callback: 'https://cloud.activepieces.com/redirect' },
};

const API = 'https://api3.sprinklr.com/prod2/api/v3';

const MOCK_HTML_500 =
  '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <title>Service Unavailable</title>\n  </head><body>down</body></html>';

const CASE = {
  id: '6a426c41413ac871af4288b3',
  caseNumber: 120338341,
  subject: '#120338341 Email Order arrived damaged',
  description: 'Broken lid',
  version: 0,
  status: 'New',
  priority: 'High',
  caseType: 'Complaint',
  workflow: { customProperties: { spr_uc_type: ['Complaint'] }, queues: [{ queueId: 103197, assignmentTime: 1782737984838 }] },
  contact: { id: 'EMAIL_jane@example.com', channelType: 'EMAIL', channelId: 'jane@example.com', fromSnUserId: 'jane@example.com' },
  createdTime: 1782737984838,
  modifiedTime: 1782737985545,
  deleted: false,
};

function mockResponses(responses: Reply[]) {
  const spy = vi.spyOn(httpClient, 'sendRequest');
  for (const response of responses) {
    if (response instanceof Error) {
      spy.mockRejectedValueOnce(response);
    } else {
      spy.mockResolvedValueOnce(response);
    }
  }
  return spy;
}

function httpError({ status, body }: { status: number; body: unknown }) {
  return new HttpError(undefined, { status, responseBody: body });
}

function wrapped(data: unknown) {
  return { status: 200, body: { data, errors: [] } };
}

function created(data: unknown) {
  return { status: 201, body: { data, errors: [] } };
}

function runAction({ action, propsValue }: { action: RunnableAction; propsValue: Record<string, unknown> }): Promise<unknown> {
  return pieceRunner.runAction({ action, auth: AUTH, propsValue });
}

async function captureError(promise: Promise<unknown>): Promise<Error> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof Error) {
      return error;
    }
    throw error;
  }
  throw new Error('expected the action to fail');
}

function sentBody({ spy, index = 0 }: { spy: ReturnType<typeof mockResponses>; index?: number }): Record<string, unknown> {
  const body = spy.mock.calls[index][0].body;
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new Error('expected a JSON object body');
  }
  return { ...body };
}

beforeEach(() => {
  vi.spyOn(sprinklrTiming, 'sleep').mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('create_case', () => {
  it('sends an upper-case channel, the email contact, lists for custom fields and the advanced fields', async () => {
    const spy = mockResponses([created(CASE)]);
    const output = await runAction({ action: createCaseAction, propsValue: {
      subject: 'Order arrived damaged',
      description: 'Broken lid',
      channel: 'email',
      contact: 'jane@example.com',
      contact_name: 'Jane Doe',
      priority: 'High',
      case_type: 'Complaint',
      queue_id: '103197',
      custom_fields: { spr_uc_type: 'Complaint', tags: ['vip', 'refund'], order_total: 42, blank: '', skipped: null },
      first_comment: 'Customer called twice.',
    } });
    expect(spy).toHaveBeenCalledTimes(1);
    const request = spy.mock.calls[0][0];
    expect(request.method).toBe(HttpMethod.POST);
    expect(request.url).toBe(`${API}/case`);
    expect(request.headers).toMatchObject({ Authorization: 'Bearer token-1', Key: 'key-1' });
    expect(sentBody({ spy })).toEqual({
      subject: 'Order arrived damaged',
      description: 'Broken lid',
      channelType: 'EMAIL',
      contactInfo: { email: 'jane@example.com', fullName: 'Jane Doe' },
      priority: 'High',
      caseType: 'Complaint',
      workflow: {
        customProperties: { spr_uc_type: ['Complaint'], tags: ['vip', 'refund'], order_total: ['42'] },
        queues: [{ queueId: 103197 }],
      },
      commentDTO: { comment: 'Customer called twice.' },
    });
    expect(output).toMatchObject({
      id: CASE.id,
      caseNumber: 120338341,
      subject: CASE.subject,
      contact: { channelType: 'EMAIL', channelId: 'jane@example.com' },
      workflow: { customProperties: { spr_uc_type: ['Complaint'] }, queues: [{ queueId: '103197' }] },
    });
  });

  it('leaves empty fields out of the body', async () => {
    const spy = mockResponses([created(CASE)]);
    await runAction({ action: createCaseAction, propsValue: {
      subject: 'Order arrived damaged',
      description: '',
      channel: 'EMAIL',
      contact: ' jane@example.com ',
      contact_name: '   ',
      priority: '',
      case_type: undefined,
      queue_id: '',
      custom_fields: {},
      first_comment: '',
    } });
    expect(sentBody({ spy })).toEqual({
      subject: 'Order arrived damaged',
      channelType: 'EMAIL',
      contactInfo: { email: 'jane@example.com' },
    });
  });

  it('needs an email when the channel is Email', async () => {
    const spy = mockResponses([]);
    const error = await captureError(
      runAction({ action: createCaseAction, propsValue: { subject: 'S', channel: 'EMAIL', contact: '+12025550123' } })
    );
    expect(error.message).toContain('is not an email address. With Channel Email');
    expect(spy).not.toHaveBeenCalled();
  });

  it('rejects an email without an @', async () => {
    const spy = mockResponses([]);
    const error = await captureError(runAction({ action: createCaseAction, propsValue: { subject: 'S', channel: 'EMAIL', contact: 'jane' } }));
    expect(error.message).toContain('is not an email address');
    expect(spy).not.toHaveBeenCalled();
  });

  it('needs a contact', async () => {
    const spy = mockResponses([]);
    const error = await captureError(runAction({ action: createCaseAction, propsValue: { subject: 'S', channel: 'SMS', contact: '  ' } }));
    expect(error.message).toContain("Contact is required. With Channel SMS, enter the customer's phone number.");
    expect(spy).not.toHaveBeenCalled();
  });

  it('needs a phone when the channel is SMS', async () => {
    const spy = mockResponses([]);
    const error = await captureError(
      runAction({ action: createCaseAction, propsValue: { subject: 'S', channel: 'SMS', contact: 'jane@example.com' } })
    );
    expect(error.message).toContain('is not a phone number. With Channel SMS');
    expect(spy).not.toHaveBeenCalled();
  });

  it('sends phoneNo and SMS for the SMS channel', async () => {
    const spy = mockResponses([created({ ...CASE, contact: { channelType: 'SMS', channelId: '+12025550123' } })]);
    await runAction({ action: createCaseAction, propsValue: { subject: 'S', channel: 'sms', contact: '+12025550123', contact_name: 'Jane' } });
    expect(sentBody({ spy })).toEqual({
      subject: 'S',
      channelType: 'SMS',
      contactInfo: { phoneNo: '+12025550123', fullName: 'Jane' },
    });
  });

  it('refuses a channel other than Email or SMS', async () => {
    const spy = mockResponses([]);
    const error = await captureError(runAction({ action: createCaseAction, propsValue: { subject: 'S', channel: 'twitter', contact: 'a@b.c' } }));
    expect(error.message).toContain('Channel must be Email or SMS');
    expect(spy).not.toHaveBeenCalled();
  });

  it('refuses a queue ID that is not digits', async () => {
    const spy = mockResponses([]);
    const error = await captureError(
      runAction({ action: createCaseAction, propsValue: { subject: 'S', channel: 'EMAIL', contact: 'a@b.c', queue_id: 'support' } })
    );
    expect(error.message).toContain('Queue ID must be a Sprinklr ID');
    expect(spy).not.toHaveBeenCalled();
  });

  it('does not retry a 5xx and says the case may exist', async () => {
    const spy = mockResponses([httpError({ status: 500, body: MOCK_HTML_500 })]);
    const error = await captureError(runAction({ action: createCaseAction, propsValue: { subject: 'S', channel: 'EMAIL', contact: 'a@b.c' } }));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(error.message).toContain('may still have gone through');
  });

  it('does not retry a timeout', async () => {
    const spy = mockResponses([new Error('The operation was aborted due to timeout')]);
    const error = await captureError(runAction({ action: createCaseAction, propsValue: { subject: 'S', channel: 'EMAIL', contact: 'a@b.c' } }));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(error.message).toContain('Sprinklr did not answer');
    expect(error.message).toContain('may still have gone through');
  });

  it('still retries a rate limit, because the call was not processed', async () => {
    const spy = mockResponses([httpError({ status: 429, body: {} }), created(CASE)]);
    const output = await runAction({ action: createCaseAction, propsValue: { subject: 'S', channel: 'EMAIL', contact: 'a@b.c' } });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(output).toMatchObject({ caseNumber: 120338341 });
  });

  it('reads the case back when the answer only carries the case number', async () => {
    const spy = mockResponses([created({ caseNumber: 120338341 }), wrapped([CASE])]);
    const output = await runAction({ action: createCaseAction, propsValue: { subject: 'S', channel: 'EMAIL', contact: 'a@b.c' } });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[1][0].method).toBe(HttpMethod.GET);
    expect(spy.mock.calls[1][0].url).toBe(`${API}/case?caseNumber=120338341`);
    expect(output).toMatchObject({ id: CASE.id, subject: CASE.subject });
  });

  it('reads the case back by ID when the answer only carries the ID', async () => {
    const spy = mockResponses([created({ id: CASE.id }), { status: 200, body: [CASE] }]);
    const output = await runAction({ action: createCaseAction, propsValue: { subject: 'S', channel: 'EMAIL', contact: 'a@b.c' } });
    expect(spy.mock.calls[1][0].url).toBe(`${API}/case?id=${CASE.id}`);
    expect(output).toMatchObject({ caseNumber: 120338341 });
  });

  it('returns what it sent when the answer is empty, without a second call', async () => {
    const spy = mockResponses([{ status: 204, body: undefined }]);
    const output = await runAction({ action: createCaseAction, propsValue: { subject: 'S', description: 'D', channel: 'EMAIL', contact: 'a@b.c' } });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(output).toMatchObject({ id: null, caseNumber: null, subject: 'S', description: 'D' });
  });

  it('returns the partial case when the read-back fails, so a retry does not duplicate it', async () => {
    const spy = mockResponses([created({ caseNumber: 120338341 }), wrapped([])]);
    const output = await runAction({ action: createCaseAction, propsValue: { subject: 'S', channel: 'EMAIL', contact: 'a@b.c' } });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(output).toMatchObject({ caseNumber: 120338341, subject: 'S' });
  });
});

describe('update_case', () => {
  it('sends PATCH with only the filled fields, then reads the case again', async () => {
    const spy = mockResponses([{ status: 204, body: undefined }, wrapped([{ ...CASE, status: 'Closed' }])]);
    const output = await runAction({ action: updateCaseAction, propsValue: {
      case_number: '#120338341',
      subject: '',
      description: undefined,
      status: 'Closed',
      priority: '  ',
      add_queue_ids: [],
      custom_fields: {},
    } });
    expect(spy).toHaveBeenCalledTimes(2);
    const patch = spy.mock.calls[0][0];
    expect(patch.method).toBe(HttpMethod.PATCH);
    expect(patch.url).toBe(`${API}/case?caseNumber=120338341`);
    expect(sentBody({ spy })).toEqual({ status: 'Closed' });
    const read = spy.mock.calls[1][0];
    expect(read.method).toBe(HttpMethod.GET);
    expect(read.url).toBe(`${API}/case?caseNumber=120338341`);
    expect(output).toMatchObject({ caseNumber: 120338341, status: 'Closed' });
  });

  it('never sends PUT', async () => {
    const spy = mockResponses([{ status: 204, body: undefined }, wrapped([CASE])]);
    await runAction({ action: updateCaseAction, propsValue: { case_number: '120338341', subject: 'New subject' } });
    expect(spy.mock.calls.map((call) => call[0].method)).not.toContain(HttpMethod.PUT);
  });

  it('puts custom fields in syncedSelectedCustomProperties as lists, with assignee and queues', async () => {
    const spy = mockResponses([{ status: 204, body: undefined }, wrapped([CASE])]);
    await runAction({ action: updateCaseAction, propsValue: {
      case_number: 120338341,
      priority: 'High',
      case_type: 'Complaint',
      summary: 'Refund sent',
      due_date: '2026-11-20T17:00:00.000Z',
      assignee_id: '60000123',
      add_queue_ids: ['103197', 5001],
      remove_queue_ids: ['42', ''],
      custom_fields: { spr_uc_type: 'Complaint', tags: ['vip'] },
    } });
    expect(sentBody({ spy })).toEqual({
      priority: 'High',
      caseType: 'Complaint',
      summary: 'Refund sent',
      dueDate: Date.parse('2026-11-20T17:00:00.000Z'),
      workflow: {
        assignment: { assigneeId: '60000123', assigneeType: 'USER' },
        addedQueues: [103197, 5001],
        removedQueues: [42],
        syncedSelectedCustomProperties: { spr_uc_type: ['Complaint'], tags: ['vip'] },
      },
    });
    const workflow = sentBody({ spy })['workflow'];
    expect(workflow).not.toHaveProperty('syncedCustomProperties');
    expect(workflow).not.toHaveProperty('customProperties');
  });

  it('refuses an update with no fields, before any call', async () => {
    const spy = mockResponses([]);
    const error = await captureError(runAction({ action: updateCaseAction, propsValue: { case_number: '120338341', subject: '', custom_fields: {}, add_queue_ids: [] } }));
    expect(error.message).toContain('Update Case has nothing to change');
    expect(spy).not.toHaveBeenCalled();
  });

  it('refuses a case number that is not a number', async () => {
    const spy = mockResponses([]);
    const error = await captureError(runAction({ action: updateCaseAction, propsValue: { case_number: 'abc', status: 'Closed' } }));
    expect(error.message).toContain('Case Number must be the number of a Sprinklr case');
    expect(spy).not.toHaveBeenCalled();
  });

  it('refuses a due date it cannot read', async () => {
    const spy = mockResponses([]);
    const error = await captureError(runAction({ action: updateCaseAction, propsValue: { case_number: '1', due_date: 'next tuesday' } }));
    expect(error.message).toContain('is not a date');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('add_case_comment', () => {
  it('sends entityType CASE and the case number as text', async () => {
    const spy = mockResponses([
      wrapped({
        id: 'c0ffee',
        text: 'Refund approved.',
        commentingUser: 60000000,
        createdTime: 1782737984838,
        modifiedTime: 1782737984838,
        entityType: 'CASE',
        entityId: '120338341',
        isPrivate: false,
      }),
    ]);
    const output = await runAction({ action: addCaseCommentAction, propsValue: { case_number: 120338341, comment: 'Refund approved.' } });
    const request = spy.mock.calls[0][0];
    expect(request.method).toBe(HttpMethod.POST);
    expect(request.url).toBe(`${API}/comment`);
    expect(sentBody({ spy })).toEqual({ entityType: 'CASE', entityId: '120338341', text: 'Refund approved.', isPrivate: false });
    expect(output).toEqual({
      id: 'c0ffee',
      text: 'Refund approved.',
      commentingUser: '60000000',
      createdTime: 1782737984838,
      entityType: 'CASE',
      entityId: '120338341',
    });
  });

  it('sends isPrivate true when Private is on', async () => {
    const spy = mockResponses([{ status: 200, body: { id: 'x', text: 'n', entityType: 'CASE', entityId: '7' } }]);
    await runAction({ action: addCaseCommentAction, propsValue: { case_number: ' #7 ', comment: 'n', is_private: true } });
    expect(sentBody({ spy })).toEqual({ entityType: 'CASE', entityId: '7', text: 'n', isPrivate: true });
  });

  it('does not retry a 5xx', async () => {
    const spy = mockResponses([httpError({ status: 502, body: MOCK_HTML_500 })]);
    const error = await captureError(runAction({ action: addCaseCommentAction, propsValue: { case_number: '7', comment: 'n' } }));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(error.message).toContain('may still have gone through');
  });

  it('refuses an empty comment', async () => {
    const spy = mockResponses([]);
    const error = await captureError(runAction({ action: addCaseCommentAction, propsValue: { case_number: '7', comment: '   ' } }));
    expect(error.message).toContain('Comment is empty');
    expect(spy).not.toHaveBeenCalled();
  });
});

type Reply = { status: number; body: unknown } | Error;
