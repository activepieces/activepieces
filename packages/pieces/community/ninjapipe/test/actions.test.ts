import { afterEach, describe, expect, it, vi } from 'vitest';
import { ninjapipe } from '../src';
import { request, runAction, stubFetch, page } from './helpers';

const ID = '11111111-2222-3333-4444-555555555555';
const MEMBER = '01a55c1c-96af-4a4f-879b-e317def0769a';
const record = { id: ID, name: 'AP test', title: 'AP test', fields: { keep: 'yes' }, created_at: '2026-10-25T10:00:00Z', updated_at: '2026-10-25T10:00:00Z' };
const wrapped = { data: record, message: 'ok' };
const deleted = { message: 'deleted', data: { id: ID, name: 'AP test' } };

type Case = {
  action: string;
  props: Record<string, unknown>;
  responses?: { status: number; body: unknown }[];
  method: string;
  path: string;
  call?: number;
  query?: Record<string, string>;
  body?: Record<string, unknown>;
};

const cases: Case[] = [
  { action: 'list_contacts', props: { search: 'jane', statusFilter: 'Lead', ownerFilter: MEMBER, assignedTo: MEMBER, sortBy: 'updated_at', sortOrder: 'asc', limit: 500, page: 2 }, responses: [{ status: 200, body: page({ data: [record] }) }], method: 'GET', path: '/contacts', query: { search: 'jane', status: 'Lead', owner_id: MEMBER, assigned_to: MEMBER, sort_by: 'updated_at', sort_order: 'asc', page: '2', limit: '100' } },
  { action: 'get_contact', props: { contactId: 'a/b' }, responses: [{ status: 200, body: wrapped }], method: 'GET', path: '/contacts/a%2Fb' },
  { action: 'create_contact', props: { firstName: 'Jane', email: ' jane@example.com ', owner: MEMBER, assignedTo: MEMBER, companyId: ID, customFields: { tier: 'gold' } }, responses: [{ status: 201, body: wrapped }], method: 'POST', path: '/contacts', body: { first_name: 'Jane', email: 'jane@example.com', owner_id: MEMBER, assigned_to: MEMBER, company_id: ID, fields: { tier: 'gold' } } },
  { action: 'update_contact', props: { contactId: ID, lastName: 'Doe', clearFields: ['phone', 'assigned_to'] }, responses: [{ status: 200, body: wrapped }], method: 'PUT', path: `/contacts/${ID}`, body: { last_name: 'Doe', phone: null, assigned_to: null } },
  { action: 'delete_contact', props: { contactId: ID }, responses: [{ status: 200, body: deleted }], method: 'DELETE', path: `/contacts/${ID}` },
  { action: 'upsert_contact', props: { email: 'jane@example.com', firstName: 'Jane' }, responses: [{ status: 200, body: page({ data: [] }) }, { status: 201, body: wrapped }], method: 'POST', path: '/contacts', call: 1, body: { email: 'jane@example.com', first_name: 'Jane' } },
  { action: 'toggle_client_portal', props: { contactId: ID, enable: false }, responses: [{ status: 200, body: wrapped }], method: 'PUT', path: `/client-portal-accounts/${ID}/disable`, body: {} },
  { action: 'list_companies', props: { search: 'acme', ownerFilter: MEMBER, limit: 0 }, responses: [{ status: 200, body: page({ data: [record] }) }], method: 'GET', path: '/companies', query: { search: 'acme', owner_id: MEMBER, page: '1', limit: '1' } },
  { action: 'get_company', props: { companyId: ID }, responses: [{ status: 200, body: wrapped }], method: 'GET', path: `/companies/${ID}` },
  { action: 'create_company', props: { name: 'Acme', industry: 'SaaS', owner: MEMBER, customFields: { size: 10 } }, responses: [{ status: 201, body: wrapped }], method: 'POST', path: '/companies', body: { name: 'Acme', industry: 'SaaS', owner_id: MEMBER, fields: { size: 10 } } },
  { action: 'update_company', props: { companyId: ID, website: 'https://acme.example', clearFields: ['phone'] }, responses: [{ status: 200, body: wrapped }], method: 'PUT', path: `/companies/${ID}`, body: { website: 'https://acme.example', phone: null } },
  { action: 'delete_company', props: { companyId: ID }, responses: [{ status: 200, body: deleted }], method: 'DELETE', path: `/companies/${ID}` },
  { action: 'list_deals', props: { statusFilter: 'Won', sortBy: 'value' }, responses: [{ status: 200, body: page({ data: [record] }) }], method: 'GET', path: '/deals', query: { status: 'Won', sort_by: 'value', page: '1', limit: '20' } },
  { action: 'get_deal', props: { dealId: ID }, responses: [{ status: 200, body: wrapped }], method: 'GET', path: `/deals/${ID}` },
  { action: 'create_deal', props: { name: 'Big', value: 0, status: 'Open', contactId: ID }, responses: [{ status: 201, body: wrapped }], method: 'POST', path: '/deals', body: { name: 'Big', value: 0, status: 'Open', contact_id: ID } },
  { action: 'update_deal', props: { dealId: ID, value: '1500', clearFields: ['company_id'] }, responses: [{ status: 200, body: wrapped }], method: 'PUT', path: `/deals/${ID}`, body: { value: 1500, company_id: null } },
  { action: 'delete_deal', props: { dealId: ID }, responses: [{ status: 200, body: deleted }], method: 'DELETE', path: `/deals/${ID}` },
  { action: 'list_products', props: { search: 'sku' }, responses: [{ status: 200, body: page({ data: [record] }) }], method: 'GET', path: '/products', query: { search: 'sku', page: '1', limit: '20' } },
  { action: 'get_product', props: { productId: ID }, responses: [{ status: 200, body: wrapped }], method: 'GET', path: `/products/${ID}` },
  { action: 'create_product', props: { name: 'P', price: 9.5, sku: 'S1' }, responses: [{ status: 201, body: wrapped }], method: 'POST', path: '/products', body: { name: 'P', price: 9.5, sku: 'S1' } },
  { action: 'update_product', props: { productId: ID, price: 0 }, responses: [{ status: 200, body: wrapped }], method: 'PUT', path: `/products/${ID}`, body: { price: 0 } },
  { action: 'delete_product', props: { productId: ID }, responses: [{ status: 200, body: deleted }], method: 'DELETE', path: `/products/${ID}` },
  { action: 'list_budgets', props: {}, responses: [{ status: 200, body: page({ data: [record] }) }], method: 'GET', path: '/budgets', query: { page: '1', limit: '20' } },
  { action: 'get_budget', props: { budgetId: ID }, responses: [{ status: 200, body: wrapped }], method: 'GET', path: `/budgets/${ID}` },
  { action: 'create_budget', props: { name: 'B', allocated: 100, category: 'Marketing', period: 'Monthly', startDate: '2026-10-01T09:00:00.000Z' }, responses: [{ status: 201, body: wrapped }], method: 'POST', path: '/budgets', body: { name: 'B', allocated: 100, category: 'Marketing', period: 'Monthly', start_date: '2026-10-01' } },
  { action: 'update_budget', props: { budgetId: ID, allocated: 200 }, responses: [{ status: 200, body: wrapped }], method: 'PUT', path: `/budgets/${ID}`, body: { allocated: 200 } },
  { action: 'delete_budget', props: { budgetId: ID }, responses: [{ status: 200, body: deleted }], method: 'DELETE', path: `/budgets/${ID}` },
  { action: 'create_budget_expense', props: { budgetId: ID, description: 'Ads', amount: '12.5', date: '2026-10-20' }, responses: [{ status: 201, body: wrapped }], method: 'POST', path: `/budgets/${ID}/expenses`, body: { description: 'Ads', amount: 12.5, date: '2026-10-20' } },
  { action: 'list_projects', props: { statusFilter: 'Planning' }, responses: [{ status: 200, body: page({ data: [record] }) }], method: 'GET', path: '/projects', query: { status: 'Planning', page: '1', limit: '20' } },
  { action: 'get_project', props: { projectId: ID }, responses: [{ status: 200, body: wrapped }], method: 'GET', path: `/projects/${ID}` },
  { action: 'create_project', props: { name: 'P', tags: ['a', ''], team: [] }, responses: [{ status: 201, body: wrapped }], method: 'POST', path: '/projects', body: { name: 'P', tags: ['a'] } },
  { action: 'update_project', props: { projectId: ID, status: 'Completed', clearFields: ['due_date'] }, responses: [{ status: 200, body: wrapped }], method: 'PUT', path: `/projects/${ID}`, body: { status: 'Completed', due_date: null } },
  { action: 'delete_project', props: { projectId: ID }, responses: [{ status: 200, body: deleted }], method: 'DELETE', path: `/projects/${ID}` },
  { action: 'list_tasks', props: { projectId: ID, statusFilter: 'Done', priorityFilter: 'High' }, responses: [{ status: 200, body: { data: [record] } }], method: 'GET', path: `/projects/${ID}/tasks`, query: { status: 'Done', priority: 'High' } },
  { action: 'get_task', props: { projectId: ID, taskId: 't 1' }, responses: [{ status: 200, body: wrapped }], method: 'GET', path: `/projects/${ID}/tasks/t%201` },
  { action: 'create_task', props: { projectId: ID, title: 'T', assigneeId: MEMBER, estimatedHours: 0 }, responses: [{ status: 201, body: wrapped }], method: 'POST', path: `/projects/${ID}/tasks`, body: { title: 'T', assignee_id: MEMBER, estimated_hours: 0 } },
  { action: 'update_task', props: { projectId: ID, taskId: ID, status: 'Done', clearFields: ['assignee_id'] }, responses: [{ status: 200, body: wrapped }], method: 'PUT', path: `/projects/${ID}/tasks/${ID}`, body: { status: 'Done', assignee_id: null } },
  { action: 'delete_task', props: { projectId: ID, taskId: ID }, responses: [{ status: 200, body: deleted }], method: 'DELETE', path: `/projects/${ID}/tasks/${ID}` },
  { action: 'list_pipelines', props: { sortBy: 'name' }, responses: [{ status: 200, body: page({ data: [record] }) }], method: 'GET', path: '/pipelines', query: { sort_by: 'name', page: '1', limit: '20' } },
  { action: 'get_pipeline', props: { pipelineId: ID }, responses: [{ status: 200, body: wrapped }], method: 'GET', path: `/pipelines/${ID}` },
  { action: 'create_pipeline', props: { name: 'P', pipelineType: 'deals', stages: [{ name: 'New Lead' }, { name: 'Won', id: 'won', color: '#059669' }] }, responses: [{ status: 201, body: wrapped }], method: 'POST', path: '/pipelines', body: { name: 'P', pipeline_type: 'deals', stages: [{ id: 'new-lead', name: 'New Lead', color: '#3b82f6' }, { id: 'won', name: 'Won', color: '#059669' }] } },
  { action: 'update_pipeline', props: { pipelineId: ID, name: 'R' }, responses: [{ status: 200, body: wrapped }], method: 'PUT', path: `/pipelines/${ID}`, body: { name: 'R' } },
  { action: 'delete_pipeline', props: { pipelineId: ID }, responses: [{ status: 200, body: deleted }], method: 'DELETE', path: `/pipelines/${ID}` },
  { action: 'list_orders', props: { statusFilter: 'Shipped' }, responses: [{ status: 200, body: page({ data: [record] }) }], method: 'GET', path: '/orders', query: { status: 'Shipped', page: '1', limit: '20' } },
  { action: 'get_order', props: { orderId: ID }, responses: [{ status: 200, body: wrapped }], method: 'GET', path: `/orders/${ID}` },
  { action: 'create_order', props: { customerName: 'C', totalAmount: 10, orderDate: '2026-10-25' }, responses: [{ status: 201, body: wrapped }], method: 'POST', path: '/orders', body: { customer_name: 'C', total_amount: 10, order_date: '2026-10-25' } },
  { action: 'update_order', props: { orderId: ID, status: 'Shipped', clearFields: ['notes'] }, responses: [{ status: 200, body: wrapped }], method: 'PUT', path: `/orders/${ID}`, body: { status: 'Shipped', notes: null } },
  { action: 'delete_order', props: { orderId: ID }, responses: [{ status: 200, body: deleted }], method: 'DELETE', path: `/orders/${ID}` },
  { action: 'add_to_list', props: { listId: ID, companyId: ID }, responses: [{ status: 201, body: { data: { list_id: ID, already_in_list: false } } }], method: 'POST', path: `/lists/${ID}/members`, body: { company_id: ID } },
  { action: 'create_pipeline_item', props: { pipelineId: ID, stageId: 's1', title: 'Card', value: 5, assignedTo: MEMBER }, responses: [{ status: 201, body: wrapped }], method: 'POST', path: `/pipelines/${ID}/items`, body: { title: 'Card', stage_id: 's1', value: 5, assigned_to: MEMBER } },
  { action: 'update_pipeline_item', props: { pipelineId: ID, itemId: ID, stageId: 'won', clearFields: ['due_date'] }, responses: [{ status: 200, body: wrapped }], method: 'PUT', path: `/pipelines/${ID}/items/${ID}`, body: { stage_id: 'won', due_date: null } },
  { action: 'add_contact_note', props: { contactId: ID, title: 'Call', content: 'Went well' }, responses: [{ status: 201, body: wrapped }], method: 'POST', path: `/contacts/${ID}/activities`, body: { type: 'note', title: 'Call', content: 'Went well' } },
  { action: 'ai_search_contacts', props: { search: 'jane', assigned_to: MEMBER, limit: 5 }, responses: [{ status: 200, body: page({ data: [record], pages: 3 }) }], method: 'GET', path: '/contacts', query: { search: 'jane', assigned_to: MEMBER, page: '1', limit: '5' } },
  { action: 'ai_get_contact', props: { contact_id: ID }, responses: [{ status: 200, body: wrapped }], method: 'GET', path: `/contacts/${ID}` },
  { action: 'ai_create_contact', props: { first_name: 'Jane', email: 'j@example.com', fields: { a: 1 } }, responses: [{ status: 201, body: wrapped }], method: 'POST', path: '/contacts', body: { first_name: 'Jane', email: 'j@example.com', fields: { a: 1 } } },
  { action: 'ai_update_contact', props: { contact_id: ID, status: 'Lead', clear_fields: ['assigned_to'] }, responses: [{ status: 200, body: wrapped }], method: 'PUT', path: `/contacts/${ID}`, body: { status: 'Lead', assigned_to: null } },
  { action: 'ai_search_companies', props: { search: 'acme' }, responses: [{ status: 200, body: page({ data: [record] }) }], method: 'GET', path: '/companies', query: { search: 'acme', page: '1', limit: '20' } },
  { action: 'ai_get_company', props: { company_id: ID }, responses: [{ status: 200, body: wrapped }], method: 'GET', path: `/companies/${ID}` },
  { action: 'ai_create_company', props: { name: 'Acme', industry: 'SaaS' }, responses: [{ status: 201, body: wrapped }], method: 'POST', path: '/companies', body: { name: 'Acme', industry: 'SaaS' } },
  { action: 'ai_update_company', props: { company_id: ID, industry: 'Retail' }, responses: [{ status: 200, body: wrapped }], method: 'PUT', path: `/companies/${ID}`, body: { industry: 'Retail' } },
  { action: 'ai_search_deals', props: { status: 'Open', sort_by: 'value', sort_order: 'desc' }, responses: [{ status: 200, body: page({ data: [record] }) }], method: 'GET', path: '/deals', query: { status: 'Open', sort_by: 'value', sort_order: 'desc', page: '1', limit: '20' } },
  { action: 'ai_get_deal', props: { deal_id: ID }, responses: [{ status: 200, body: wrapped }], method: 'GET', path: `/deals/${ID}` },
  { action: 'ai_create_deal', props: { name: 'D', value: 10, status: 'Open' }, responses: [{ status: 201, body: wrapped }], method: 'POST', path: '/deals', body: { name: 'D', value: 10, status: 'Open' } },
  { action: 'ai_update_deal', props: { deal_id: ID, status: 'Won' }, responses: [{ status: 200, body: wrapped }], method: 'PUT', path: `/deals/${ID}`, body: { status: 'Won' } },
  { action: 'ai_list_projects', props: { status: 'Planning', page: 2 }, responses: [{ status: 200, body: page({ data: [record], page: 2, pages: 2 }) }], method: 'GET', path: '/projects', query: { status: 'Planning', page: '2', limit: '20' } },
  { action: 'list_tasks', props: { projectId: ID, rootOnly: true }, responses: [{ status: 200, body: { data: [record] } }], method: 'GET', path: `/projects/${ID}/tasks`, query: { parent_id: '' } },
  { action: 'list_tasks', props: { projectId: ID, parentId: '' }, responses: [{ status: 200, body: { data: [record] } }], method: 'GET', path: `/projects/${ID}/tasks`, query: {} },
  { action: 'ai_list_tasks', props: { project_id: ID, parent_id: '' }, responses: [{ status: 200, body: { data: [record] } }], method: 'GET', path: `/projects/${ID}/tasks`, query: {} },
  { action: 'list_tasks', props: { projectId: ID, parentId: ' t1 ', rootOnly: true }, responses: [{ status: 200, body: { data: [record] } }], method: 'GET', path: `/projects/${ID}/tasks`, query: { parent_id: 't1' } },
  { action: 'ai_list_tasks', props: { project_id: ID, root_only: true }, responses: [{ status: 200, body: { data: [record] } }], method: 'GET', path: `/projects/${ID}/tasks`, query: { parent_id: '' } },
  { action: 'ai_list_tasks', props: { project_id: ID, status: 'Done' }, responses: [{ status: 200, body: { data: [record] } }], method: 'GET', path: `/projects/${ID}/tasks`, query: { status: 'Done' } },
  { action: 'ai_create_task', props: { project_id: ID, title: 'T', due_date: '2026-12-01' }, responses: [{ status: 201, body: wrapped }], method: 'POST', path: `/projects/${ID}/tasks`, body: { title: 'T', due_date: '2026-12-01' } },
  { action: 'ai_update_task', props: { project_id: ID, task_id: ID, status: 'Done' }, responses: [{ status: 200, body: wrapped }], method: 'PUT', path: `/projects/${ID}/tasks/${ID}`, body: { status: 'Done' } },
  { action: 'ai_list_pipelines', props: {}, responses: [{ status: 200, body: page({ data: [record] }) }], method: 'GET', path: '/pipelines', query: { page: '1', limit: '20' } },
  { action: 'ai_list_pipeline_items', props: { pipeline_id: ID }, responses: [{ status: 200, body: { data: [record] } }], method: 'GET', path: `/pipelines/${ID}/items` },
  { action: 'ai_create_pipeline_item', props: { pipeline_id: ID, stage_id: 's1', title: 'Card' }, responses: [{ status: 201, body: wrapped }], method: 'POST', path: `/pipelines/${ID}/items`, body: { title: 'Card', stage_id: 's1' } },
  { action: 'ai_update_pipeline_item', props: { pipeline_id: ID, item_id: ID, stage_id: 'won' }, responses: [{ status: 200, body: wrapped }], method: 'PUT', path: `/pipelines/${ID}/items/${ID}`, body: { stage_id: 'won' } },
  { action: 'ai_list_workspace_members', props: {}, responses: [{ status: 200, body: { data: [{ account_id: MEMBER }] } }], method: 'GET', path: '/workspace/members' },
  { action: 'ai_add_contact_note', props: { contact_id: ID, title: 'Note' }, responses: [{ status: 201, body: wrapped }], method: 'POST', path: `/contacts/${ID}/activities`, body: { type: 'note', title: 'Note' } },
  { action: 'ai_list_contact_activities', props: { contact_id: ID, type: 'note' }, responses: [{ status: 200, body: page({ data: [record] }) }], method: 'GET', path: `/contacts/${ID}/activities`, query: { type: 'note', page: '1', limit: '20' } },
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('every action sends the documented request', () => {
  it.each(cases)('$action', async ({ action, props, responses, method, path, call = 0, query, body }) => {
    const fetchMock = stubFetch({ responses: responses ?? [{ status: 200, body: wrapped }] });
    const output = await runAction({ name: action, propsValue: props });
    const sent = request({ fetchMock, call });
    expect(sent.method).toBe(method);
    expect(sent.url.origin + sent.url.pathname).toBe(`https://www.ninjapipe.app/api${path}`);
    expect(sent.headers.get('authorization')).toBe('Bearer np_test');
    if (query) expect(sent.query).toEqual(query);
    if (body) expect(sent.body).toEqual(body);
    expect(output).toBeTruthy();
  });

  it('covers every action except Custom API Call and Send to Databin', () => {
    const covered = new Set(cases.map((item) => item.action));
    const missing = Object.keys(ninjapipe.actions()).filter((name) => !covered.has(name));
    expect(missing.sort()).toEqual(['custom_api_call', 'send_to_databin']);
  });
});

describe('output shape', () => {
  it('get actions return the unwrapped record, not data_* keys', async () => {
    stubFetch({ responses: [{ status: 200, body: wrapped }] });
    const output = await runAction({ name: 'get_contact', propsValue: { contactId: ID } });
    expect(output).toEqual(record);
  });

  it('list actions return items, total, hasMore and nextPage', async () => {
    stubFetch({ responses: [{ status: 200, body: page({ data: [record], page: 1, pages: 3, total: 41 }) }] });
    const output = await runAction({ name: 'list_deals', propsValue: { limit: 20 } });
    expect(output).toEqual({ items: [record], count: 1, total: 41, hasMore: true, nextPage: 2 });
  });

  it('companies pagination without pages falls back to a full page meaning more', async () => {
    stubFetch({ responses: [{ status: 200, body: { data: [record], pagination: { page: 1, limit: 1, total: null, totalPages: 0 } } }] });
    const output = await runAction({ name: 'list_companies', propsValue: { limit: 1 } });
    expect(output).toMatchObject({ hasMore: true, nextPage: 2 });
  });

  it('delete returns deleted, id and name', async () => {
    stubFetch({ responses: [{ status: 200, body: deleted }] });
    const output = await runAction({ name: 'delete_deal', propsValue: { dealId: ID } });
    expect(output).toEqual({ deleted: true, id: ID, name: 'AP test', message: 'deleted' });
  });

  it('portal enable returns the generated password next to the record', async () => {
    stubFetch({ responses: [{ status: 200, body: { data: { id: 'p1', contact_id: ID }, message: 'enabled', generated_password: 'pw' } }] });
    const output = await runAction({ name: 'toggle_client_portal', propsValue: { contactId: ID, enable: true, email: 'a@b.c' } });
    expect(output).toEqual({ enabled: true, id: 'p1', contact_id: ID, generated_password: 'pw', message: 'enabled' });
  });
});
