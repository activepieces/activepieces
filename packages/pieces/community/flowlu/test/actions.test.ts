import { beforeEach, describe, expect, it, vi } from 'vitest';
import dayjs from 'dayjs';
import {
  AUTH,
  BASE,
  form,
  listBody,
  ok,
  request,
  runAction,
  sendRequest,
} from './helpers';
import { createContactAction } from '../src/lib/actions/accounts/create-contact';
import { createOrganizationAction } from '../src/lib/actions/accounts/create-organization';
import { updateContactAction } from '../src/lib/actions/accounts/update-contact';
import { findAccountsAction } from '../src/lib/actions/accounts/find-accounts';
import { createOpportunityAction } from '../src/lib/actions/opportunities/create-opportunity';
import { updateOpportunityAction } from '../src/lib/actions/opportunities/update-opportunity';
import { linkAccountToOpportunityAction } from '../src/lib/actions/opportunities/link-account-to-opportunity';
import { createTaskAction } from '../src/lib/actions/tasks/create-task';
import { updateTaskAction } from '../src/lib/actions/tasks/update-task';
import { getTaskAction } from '../src/lib/actions/tasks/get-task';
import { findTasksAction } from '../src/lib/actions/tasks/find-tasks';
import { listLookupValuesAction } from '../src/lib/actions/lookups/list-lookup-values';
import { listUsersAction } from '../src/lib/actions/lookups/list-users';
import { updateProjectAction } from '../src/lib/actions/projects/update-project';
import { flowluAccountCreate } from '../src/lib/actions/ai/account-create';
import { flowluOpportunityCreate } from '../src/lib/actions/ai/opportunity-create';
import { flowluOpportunityUpdate } from '../src/lib/actions/ai/opportunity-update';
import { flowluTaskCreate } from '../src/lib/actions/ai/task-create';
import { flowluTaskUpdate } from '../src/lib/actions/ai/task-update';
import { flowluTaskDelete } from '../src/lib/actions/ai/task-delete';
import { flowluCommon } from '../src/lib/common';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@activepieces/pieces-common')
  >();
  return {
    ...actual,
    httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) },
  };
});

beforeEach(() => {
  sendRequest.mockReset();
});

describe('existing account actions', () => {
  it('Create Contact sends the props, not the whole context (P1-2)', async () => {
    ok({ response: { id: 1 } });
    await runAction({
      action: createContactAction,
      props: {
        first_name: 'Jane',
        last_name: 'Doe',
        vat: 'DE123',
        link_linkedin: 'https://linkedin.com/in/jane',
        description: undefined,
      },
    });
    expect(request(0).url).toBe(`${BASE}/crm/account/create`);
    expect(form(0)).toEqual({
      first_name: 'Jane',
      last_name: 'Doe',
      VAT: 'DE123',
      social_network_link_5: 'https://linkedin.com/in/jane',
      type: '2',
    });
  });

  it('Create Organization maps legacy prop keys to Flowlu field names and drops Google+', async () => {
    ok({ response: { id: 2 } });
    await runAction({
      action: createOrganizationAction,
      props: {
        name: 'Acme',
        skype: 'acme.sk',
        link_facebook: 'fb',
        link_instagram: 'ig',
        link_google: 'g+',
        telegram: '@acme',
      },
    });
    expect(form(0)).toEqual({
      name: 'Acme',
      social_network_link_1: 'acme.sk',
      social_network_link_3: 'fb',
      social_network_link_6: 'ig',
      telegram: '@acme',
      type: '1',
    });
  });

  it('Update Contact sends only filled fields, without id or a forced type (P2-7)', async () => {
    ok({ response: { id: 3, first_name: 'Janet' } });
    await runAction({
      action: updateContactAction,
      props: { id: 3, first_name: 'Janet', last_name: undefined },
    });
    expect(request(0).url).toBe(`${BASE}/crm/account/update/3`);
    expect(form(0)).toEqual({ first_name: 'Janet' });
  });
});

describe('existing task actions', () => {
  it('Create Task never sends "undefined" (P1-3) and links a project', async () => {
    ok({ response: { id: 10 } });
    await runAction({
      action: createTaskAction,
      props: { name: 'Call Jane', type: 0, project_id: 7 },
    });
    const body = request(0).body ?? '';
    expect(body).not.toContain('undefined');
    expect(form(0)).toEqual({
      name: 'Call Jane',
      deadline_allowchange: '0',
      task_checkbyowner: '0',
      module: 'st',
      model: 'project',
      model_id: '7',
      type: '0',
    });
  });

  it('Update Task without a name does not rename it, and keeps an event an event (P1-3, P1-4)', async () => {
    ok({ response: { id: 10 } });
    await runAction({
      action: updateTaskAction,
      props: { task_id: 10, priority: 3, type: 0 },
    });
    expect(form(0)).toEqual({
      priority: '3',
      deadline_allowchange: '0',
      task_checkbyowner: '0',
    });
  });

  it('Update Task sends a non-default type, the checkboxes and an optional status', async () => {
    ok({ response: { id: 10 } });
    await runAction({
      action: updateTaskAction,
      props: {
        task_id: 10,
        type: 20,
        deadline_allowchange: true,
        status: 5,
        deadline: '2026-10-05T17:00:00.000Z',
      },
    });
    expect(form(0)).toMatchObject({
      type: '20',
      deadline_allowchange: '1',
      task_checkbyowner: '0',
      status: '5',
    });
    expect(form(0)['deadline']).toMatch(/^2026-10-0\d \d\d:00:00$/);
  });

  it('Get Task fails on Flowlu not-found instead of returning the error body (P1-1)', async () => {
    ok({ error: { error_code: 20, error_msg: 'not found' } });
    await expect(
      runAction({ action: getTaskAction, props: { task_id: 999 } })
    ).rejects.toThrow('could not find the record');
  });

  it('rejects a non-numeric ID before any request', async () => {
    await expect(
      runAction({ action: getTaskAction, props: { task_id: 'abc' } })
    ).rejects.toThrow('numeric Flowlu ID');
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('existing opportunity actions', () => {
  it('Create Opportunity formats dates and links the customer through crm/lead_accounts (P2-3, P2-4)', async () => {
    ok({ response: { id: 50 } });
    ok({ response: { id: 17, type: 1 } });
    ok(listBody({ items: [] }));
    ok({ response: { id: 900 } });
    const result = await runAction({
      action: createOpportunityAction,
      props: {
        name: 'Deal',
        customer_id: 17,
        start_date: '2026-10-01T10:00:00.000Z',
        deadline: '2026-11-30T10:00:00.000Z',
      },
    });
    expect(form(0)).toMatchObject({
      name: 'Deal',
      start_date: '2026-10-01',
      deadline: '2026-11-30',
    });
    expect(request(1).url).toBe(`${BASE}/crm/account/get/17`);
    expect(request(2).queryParams).toMatchObject({
      'filter[lead_id]': '50',
      'filter[account_id]': '17',
    });
    expect(form(3)).toEqual({
      lead_id: '50',
      account_id: '17',
      account_type: '1',
    });
    expect(result).toMatchObject({
      response: { id: 50 },
      linked_accounts: [
        {
          id: 900,
          lead_id: 50,
          account_id: 17,
          account_type: 1,
          already_linked: false,
        },
      ],
      link_errors: [],
    });
  });

  it('Create Opportunity reports a failed link without failing the step', async () => {
    ok({ response: { id: 51 } });
    ok(listBody({ items: [] }));
    ok({ error: 'validation', details: { account_id: 'not found' } });
    const result = await runAction({
      action: createOpportunityAction,
      props: { name: 'Deal', contact_id: 5 },
    });
    expect(result).toMatchObject({
      response: { id: 51 },
      linked_accounts: [],
      link_errors: [
        {
          account_id: 5,
          error: 'Flowlu validation error: account_id: not found.',
        },
      ],
    });
  });

  it('Create Opportunity output is unchanged when no account is given', async () => {
    ok({ response: { id: 52 } });
    await expect(
      runAction({ action: createOpportunityAction, props: { name: 'Deal' } })
    ).resolves.toEqual({ response: { id: 52 } });
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('Update Opportunity can mark a deal won and stamps the close date', async () => {
    ok({ response: { id: 50, active: 1, closing_date: '' } });
    ok({ response: { id: 50 } });
    await runAction({
      action: updateOpportunityAction,
      props: { id: 50, status: 3, closing_comment: 'Signed' },
    });
    expect(request(0).url).toBe(`${BASE}/crm/lead/get/50`);
    expect(request(1).url).toBe(`${BASE}/crm/lead/update/50`);
    expect(form(1)).toEqual({
      active: '3',
      closing_date: dayjs().format('YYYY-MM-DD'),
      closing_comment: 'Signed',
    });
  });

  it('Update Opportunity marked Won again keeps the existing close date', async () => {
    ok({ response: { id: 50, active: 3, closing_date: '2026-09-01' } });
    ok({ response: { id: 50 } });
    await runAction({
      action: updateOpportunityAction,
      props: { id: 50, status: 3 },
    });
    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(form(1)).toEqual({ active: '3' });
  });

  it('Update Opportunity moves the stage within the current pipeline without a Pipeline ID', async () => {
    ok({ response: { id: 50, pipeline_id: 1, pipeline_stage_id: 1 } });
    ok(listBody({ items: [{ id: 3, pipeline_id: 1 }] }));
    ok({ response: { id: 50 } });
    await runAction({
      action: updateOpportunityAction,
      props: { id: 50, pipeline_stage_id: 3 },
    });
    expect(request(1).url).toBe(`${BASE}/crm/pipeline_stage/list`);
    expect(request(1).queryParams).toMatchObject({
      'filter[pipeline_id]': '1',
    });
    expect(request(2).url).toBe(`${BASE}/crm/lead/update/50`);
    expect(form(2)).toEqual({ pipeline_id: '1', pipeline_stage_id: '3' });
  });

  it('Create Opportunity rejects a non-numeric Customer ID before creating anything', async () => {
    await expect(
      runAction({
        action: createOpportunityAction,
        props: { name: 'Deal', customer_id: 'acme' },
      })
    ).rejects.toThrow('Customer ID must be a numeric Flowlu ID');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('Create Opportunity rejects a stage of another pipeline before creating anything', async () => {
    ok(listBody({ items: [{ id: 1, pipeline_id: 1 }] }));
    await expect(
      runAction({
        action: createOpportunityAction,
        props: { name: 'Deal', pipeline_id: 1, pipeline_stage_id: 9 },
      })
    ).rejects.toThrow('Pipeline Stage ID 9 is not a stage of pipeline 1');
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('Create Opportunity finds a stage on a later page of a large pipeline', async () => {
    const firstPage = Array.from({ length: 100 }, (_, i) => ({ id: i + 1, pipeline_id: 1 }));
    ok(listBody({ items: firstPage, total: 150 }));
    ok(listBody({ items: [{ id: 140, pipeline_id: 1 }], total: 150, page: 2 }));
    ok({ response: { id: 70 } });
    ok({ response: { id: 70, name: 'Deal', pipeline_id: 1, pipeline_stage_id: 140 } });
    await runAction({
      action: createOpportunityAction,
      props: { name: 'Deal', pipeline_id: 1, pipeline_stage_id: 140 },
    });
    expect(request(0).queryParams['page']).toBe('1');
    expect(request(1).queryParams['page']).toBe('2');
    expect(request(2).url).toBe(`${BASE}/crm/lead/create`);
  });

  it('Create Opportunity rejects a stage missing from every page before creating anything', async () => {
    const firstPage = Array.from({ length: 100 }, (_, i) => ({ id: i + 1, pipeline_id: 1 }));
    ok(listBody({ items: firstPage, total: 150 }));
    ok(listBody({ items: Array.from({ length: 50 }, (_, i) => ({ id: i + 101, pipeline_id: 1 })), total: 150, page: 2 }));
    await expect(
      runAction({
        action: createOpportunityAction,
        props: { name: 'Deal', pipeline_id: 1, pipeline_stage_id: 999 },
      })
    ).rejects.toThrow('Pipeline Stage ID 999 is not a stage of pipeline 1');
    expect(sendRequest).toHaveBeenCalledTimes(2);
  });

  it('Update Opportunity rejects a non-numeric Contact ID before updating', async () => {
    await expect(
      runAction({
        action: updateOpportunityAction,
        props: { id: 50, name: 'Renamed', contact_id: 'jane' },
      })
    ).rejects.toThrow('Contact ID must be a numeric Flowlu ID');
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('AI atomics', () => {
  it('flowlu_task_update sends only the given fields and models flags as three states', async () => {
    ok({ response: { id: 10 } });
    await runAction({
      action: flowluTaskUpdate,
      props: { task_id: '10', task_checkbyowner: 'no', status: 5 },
    });
    expect(form(0)).toEqual({ status: '5', task_checkbyowner: '0' });
  });

  it('flowlu_task_update refuses an empty update', async () => {
    await expect(
      runAction({ action: flowluTaskUpdate, props: { task_id: '10' } })
    ).rejects.toThrow('Nothing to update');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('flowlu_task_create re-reads the task when create returns only the id', async () => {
    ok({ response: { id: 11, _resultMessage: 'ok' } });
    ok({ response: { id: 11, name: 'Call', status: 1 } });
    const result = await runAction({
      action: flowluTaskCreate,
      props: { name: 'Call', project_id: '7' },
    });
    expect(form(0)).toEqual({
      name: 'Call',
      module: 'st',
      model: 'project',
      model_id: '7',
    });
    expect(request(1).url).toBe(`${BASE}/task/tasks/get/11`);
    expect(result).toEqual({
      id: 11,
      name: 'Call',
      status: 1,
      read_back_error: null,
    });
  });

  it('flowlu_task_create reports a failed read-back instead of failing, so a retry does not duplicate the task', async () => {
    ok({ response: { id: 12 } });
    ok({ error: { error_code: 20, error_msg: 'not found' } });
    const result = await runAction({
      action: flowluTaskCreate,
      props: { name: 'Call' },
    });
    expect(result).toMatchObject({ id: 12 });
    expect(JSON.stringify(result)).toContain('reading it back failed');
  });

  it('flowlu_task_update rejects a status Flowlu does not have', async () => {
    await expect(
      runAction({
        action: flowluTaskUpdate,
        props: { task_id: '10', status: 2 },
      })
    ).rejects.toThrow('Status must be one of 1, 3, 4, 5');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('flowlu_task_delete returns the deleted id', async () => {
    ok({ response: { id: '11' } });
    await expect(
      runAction({ action: flowluTaskDelete, props: { task_id: '11' } })
    ).resolves.toEqual({ id: 11, deleted: true });
    expect(request(0).url).toBe(`${BASE}/task/tasks/delete/11`);
  });

  it('flowlu_account_create needs a first name for a contact, before any request', async () => {
    await expect(
      runAction({
        action: flowluAccountCreate,
        props: { account_type: 'contact', last_name: 'Doe' },
      })
    ).rejects.toThrow('First Name is required');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('flowlu_account_create reads the record back even when create returns some fields', async () => {
    ok({ response: { id: 3, name: 'Acme' } });
    ok({ response: { id: 3, name: 'Acme', type: 1, email: 'a@acme.test' } });
    const result = await runAction({
      action: flowluAccountCreate,
      props: { account_type: 'organization', name: 'Acme' },
    });
    expect(request(1).url).toBe(`${BASE}/crm/account/get/3`);
    expect(result).toEqual({
      id: 3,
      name: 'Acme',
      type: 1,
      email: 'a@acme.test',
      read_back_error: null,
    });
  });

  it('flowlu_account_create uses Flowlu field names', async () => {
    ok({ response: { id: 3, name: 'Acme' } });
    ok({ response: { id: 3, name: 'Acme' } });
    await runAction({
      action: flowluAccountCreate,
      props: {
        account_type: 'organization',
        name: 'Acme',
        vat: 'X1',
        linkedin: 'li',
      },
    });
    expect(form(0)).toEqual({
      name: 'Acme',
      VAT: 'X1',
      social_network_link_5: 'li',
      type: '1',
    });
  });

  it('flowlu_opportunity_create refuses a stage without a pipeline', async () => {
    await expect(
      runAction({
        action: flowluOpportunityCreate,
        props: { name: 'Deal', pipeline_stage_id: '4' },
      })
    ).rejects.toThrow('Pipeline Stage ID needs Pipeline ID');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('flowlu_opportunity_create links organization and contact with their types', async () => {
    ok({ response: { id: 60, name: 'Deal' } });
    ok(listBody({ items: [] }));
    ok({ response: { id: 1 } });
    ok(listBody({ items: [] }));
    ok({ response: { id: 2 } });
    ok({ response: { id: 60, name: 'Deal', company_id: '17' } });
    const result = await runAction({
      action: flowluOpportunityCreate,
      props: { name: 'Deal', organization_id: '17', contact_id: '18' },
    });
    expect(request(5).url).toBe(`${BASE}/crm/lead/get/60`);
    expect(form(2)).toEqual({
      lead_id: '60',
      account_id: '17',
      account_type: '1',
    });
    expect(form(4)).toEqual({
      lead_id: '60',
      account_id: '18',
      account_type: '2',
    });
    expect(result).toMatchObject({
      id: 60,
      company_id: '17',
      read_back_error: null,
      link_errors: [],
    });
  });

  it('flowlu_opportunity_create rejects a bad Contact ID before creating anything', async () => {
    await expect(
      runAction({
        action: flowluOpportunityCreate,
        props: { name: 'Deal', contact_id: 'jane' },
      })
    ).rejects.toThrow('Contact ID must be a numeric Flowlu ID');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('flowlu_opportunity_update moves the stage with only a Pipeline Stage ID', async () => {
    ok({ response: { id: 60, pipeline_id: 2 } });
    ok(listBody({ items: [{ id: 7, pipeline_id: 2 }] }));
    ok({ response: { id: 60, pipeline_id: 2, pipeline_stage_id: 7 } });
    await runAction({
      action: flowluOpportunityUpdate,
      props: { opportunity_id: '60', pipeline_stage_id: '7' },
    });
    expect(request(0).url).toBe(`${BASE}/crm/lead/get/60`);
    expect(form(2)).toEqual({ pipeline_id: '2', pipeline_stage_id: '7' });
  });

  it('flowlu_opportunity_update refuses a stage outside the current pipeline without updating', async () => {
    ok({ response: { id: 60, pipeline_id: 2 } });
    ok(listBody({ items: [{ id: 7, pipeline_id: 2 }] }));
    await expect(
      runAction({
        action: flowluOpportunityUpdate,
        props: { opportunity_id: '60', pipeline_stage_id: '3' },
      })
    ).rejects.toThrow('Pipeline Stage ID 3 is not a stage of pipeline 2');
    expect(sendRequest).toHaveBeenCalledTimes(2);
  });

  it('flowlu_opportunity_update marked Won again keeps the existing close date', async () => {
    ok({ response: { id: 60, active: 3, closing_date: '2026-09-01' } });
    ok({ response: { id: 60, active: 3, closing_date: '2026-09-01' } });
    await runAction({
      action: flowluOpportunityUpdate,
      props: { opportunity_id: '60', status: 3 },
    });
    expect(form(1)).toEqual({ active: '3' });
  });

  it('flowlu_opportunity_update stamps today when a deal moves from Lost to Won', async () => {
    ok({ response: { id: 60, active: 2, closing_date: '2026-09-01' } });
    ok({ response: { id: 60 } });
    await runAction({
      action: flowluOpportunityUpdate,
      props: { opportunity_id: '60', status: 3 },
    });
    expect(form(1)).toEqual({
      active: '3',
      closing_date: dayjs().format('YYYY-MM-DD'),
    });
  });

  it('flowlu_opportunity_update closes a deal as lost with a reason', async () => {
    ok({ response: { id: 60 } });
    await runAction({
      action: flowluOpportunityUpdate,
      props: {
        opportunity_id: '60',
        status: 2,
        closing_status_id: '3',
        closing_date: '2026-09-30T12:00:00Z',
      },
    });
    expect(form(0)).toEqual({
      active: '2',
      closing_date: '2026-09-30',
      closing_status_id: '3',
    });
  });
});

describe('link and search actions', () => {
  it('Link Account to Opportunity returns the existing link instead of duplicating it', async () => {
    ok(
      listBody({
        items: [{ id: 5, lead_id: 60, account_id: 17, account_type: 1 }],
      })
    );
    const result = await runAction({
      action: linkAccountToOpportunityAction,
      props: {
        opportunity_id: '60',
        account_id: '17',
        account_type: 'organization',
      },
    });
    expect(result).toEqual({
      id: 5,
      lead_id: 60,
      account_id: 17,
      account_type: 1,
      already_linked: true,
    });
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('Find Tasks pages with has_more and filters by project', async () => {
    ok(listBody({ items: [{ id: 1 }, { id: 2 }], total: 5, page: 2 }));
    const result = await runAction({
      action: findTasksAction,
      props: { project_id: '7', page: 2, limit: 2, status: 5 },
    });
    expect(request(0).queryParams).toMatchObject({
      'filter[module]': 'st',
      'filter[model]': 'project',
      'filter[model_id]': '7',
      'filter[status]': '5',
      'order_by[desc][]': 'id',
      page: '2',
      limit: '2',
    });
    expect(result).toEqual({
      items: [{ id: 1 }, { id: 2 }],
      page: 2,
      count: 2,
      total: 5,
      has_more: true,
    });
  });

  it('Find CRM Accounts filters contacts and active ones by default', async () => {
    ok(listBody({ items: [] }));
    await runAction({
      action: findAccountsAction,
      props: { account_type: 'contact', search: 'acme' },
    });
    expect(request(0).queryParams).toMatchObject({
      'filter[type]': '2',
      'filter[active]': '1',
      search: 'acme',
      limit: '50',
    });
  });

  it("rejects a limit above Flowlu's maximum of 100 (0 would switch Flowlu to export mode)", async () => {
    await expect(
      runAction({ action: findTasksAction, props: { limit: 101 } })
    ).rejects.toThrow('Limit must be');
    await expect(
      runAction({ action: findTasksAction, props: { limit: 0 } })
    ).rejects.toThrow('Limit must be');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('List Users returns curated rows only', async () => {
    ok(
      listBody({
        items: [
          {
            id: 1,
            name: 'Jane',
            username: 'jane@example.com',
            image: '/x.png',
            role_admin: 1,
          },
        ],
      })
    );
    const result = await runAction({ action: listUsersAction, props: {} });
    expect(request(0).url).toBe(`${BASE}/core/user/list`);
    expect(result).toMatchObject({
      items: [
        { id: 1, name: 'Jane', username: 'jane@example.com', role_admin: 1 },
      ],
      has_more: false,
    });
    expect(JSON.stringify(result)).not.toContain('image');
  });

  it('List Reference Values pages to the end and filters stages by pipeline', async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `S${i + 1}`,
      pipeline_id: 4,
    }));
    ok(listBody({ items: page1, total: 101 }));
    ok(
      listBody({
        items: [{ id: 101, name: 'S101', pipeline_id: 4 }],
        total: 101,
        page: 2,
      })
    );
    const result = await runAction({
      action: listLookupValuesAction,
      props: { entity: 'pipeline_stages', parent_id: '4' },
    });
    expect(request(0).url).toBe(`${BASE}/crm/pipeline_stage/list`);
    expect(request(0).queryParams).toMatchObject({
      'filter[pipeline_id]': '4',
      page: '1',
      limit: '100',
    });
    expect(request(1).queryParams).toMatchObject({ page: '2' });
    expect(result).toMatchObject({
      entity: 'pipeline_stages',
      count: 101,
      total: 101,
      has_more: false,
    });
  });

  it('List Reference Values refuses a parent for a value type without one', async () => {
    await expect(
      runAction({
        action: listLookupValuesAction,
        props: { entity: 'industries', parent_id: '4' },
      })
    ).rejects.toThrow('have no parent');
  });

  it('Update Project refuses an empty update', async () => {
    await expect(
      runAction({ action: updateProjectAction, props: { project_id: 7 } })
    ).rejects.toThrow('Nothing to update');
  });
});

describe('dropdowns', () => {
  const options = ({
    prop,
    searchValue,
  }: {
    prop: unknown;
    searchValue?: string;
  }) => {
    const fn: unknown = Reflect.get(Object(prop), 'options');
    if (typeof fn !== 'function') {
      throw new Error('no options');
    }
    return Promise.resolve(
      Reflect.apply(fn, undefined, [{ auth: AUTH }, { searchValue }])
    );
  };

  it('asks for 100 newest records, searches, and says when the list is cut', async () => {
    ok(listBody({ items: [{ id: 9, name: 'Task 9' }], total: 250 }));
    const result = await options({
      prop: flowluCommon.task_id(true),
      searchValue: 'call',
    });
    expect(request(0).queryParams).toMatchObject({
      limit: '100',
      'order_by[desc][]': 'id',
      search: 'call',
    });
    expect(result).toEqual({
      disabled: false,
      options: [{ label: 'Task 9 (#9)', value: 9 }],
      placeholder: 'Showing the first 1 of 250.',
    });
  });

  it('returns a disabled state with the reason when Flowlu fails', async () => {
    ok({ error: { error_code: 11, error_msg: 'api key not found' } });
    const result = await options({ prop: flowluCommon.user_id(true) });
    expect(result).toMatchObject({ disabled: true, options: [] });
    expect(JSON.stringify(result)).toContain('error 11');
  });
});
