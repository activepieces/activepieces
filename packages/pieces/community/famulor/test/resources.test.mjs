import { afterEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import { famulorResources, resources } from '../src/lib/common/resources';
import { operationById } from '../src/lib/common/action';
import { famulor } from '../src';

const token = 'test-workspace-key';
const response = (data) => ({ status: 200, headers: {}, body: { data } });
afterEach(() => vi.restoreAllMocks());

describe('workspace resource selectors', () => {
  it('exposes native assistant and campaign selectors without an operation selection step', async () => {
    const action = famulor.actions().makePhoneCall;
    expect(action.props.body_assistant_id.type).toBe('DROPDOWN');
    expect(action.props.body_assistant_id.refreshOnSearch).toBe(true);
    expect(action.props.operation).toBeUndefined();
    expect(await action.props.body_assistant_id.options({}, {})).toMatchObject({ disabled: true, options: [] });
    expect(famulor.triggers().newCampaignLead.props.campaign_id.type).toBe('DROPDOWN');
  });
  it.each(resources)('loads $label options with the workspace read request', async (resource) => {
    const rows = [{ id: '00000000-0000-4000-8000-000000000001', name: 'QA Resource' }];
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(response(resource.key ? { [resource.key]: rows } : rows));
    const result = await famulorResources.resourceOptions({ token, resource });
    expect(result.options[0]).toEqual({ label: 'QA Resource (00000000-0000-4000-8000-000000000001)', value: rows[0].id });
    expect(send.mock.lastCall[0]).toMatchObject({ method: 'GET', url: `https://app.famulor.io/api/v1${resource.path}`, authentication: { token }, followRedirects: false });
  });
  it('searches paginated options by label or UUID without mutating the workspace', async () => {
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(response(Array.from({ length: 100 }, (_, i) => ({ id: `id-${i}`, name: `Other ${i}` })))).mockResolvedValueOnce(response([{ id: 'wanted-id', name: 'Wanted Assistant' }]));
    const props = famulorResources.resourceProperty({ field: { name: 'id', in: 'path', required: true }, operation: operationById('getAssistant') });
    expect((await props.options({ auth: { secret_text: token } }, { searchValue: 'wanted' })).options).toHaveLength(1);
    expect(send.mock.lastCall[0].queryParams.offset).toBe('100');
    expect(send.mock.calls.every(([req]) => req.method === 'GET')).toBe(true);
  });
  it('finds an older resource beyond 2,000 records when the API has no search filter', async () => {
    const send = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (req) => {
      const offset = Number(req.queryParams.offset);
      return response(offset < 2200 ? Array.from({ length: 100 }, (_, i) => ({ id: `id-${offset + i}`, name: 'Other' })) : [{ id: 'old-resource', name: 'Older Assistant' }]);
    });
    const result = await famulorResources.resourceOptions({ token, resource: resources[0], searchValue: 'Older Assistant' });
    expect(result.options.map((item) => item.value)).toEqual(['old-resource']);
    expect(send.mock.lastCall[0].queryParams.offset).toBe('2200');
  });
  it('uses exact UUID lookup without scanning older pages', async () => {
    const id = '00000000-0000-4000-8000-000000000001';
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(response({ id, name: 'Older Assistant' }));
    const result = await famulorResources.resourceOptions({ token, resource: resources[0], searchValue: id });
    expect(result.options[0].value).toBe(id);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.lastCall[0].url).toBe(`https://app.famulor.io/api/v1/assistants/${id}`);
  });
  it('unwraps the automation detail response when searching by exact UUID', async () => {
    const id = '00000000-0000-4000-8000-000000000001';
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(response({ automation: { id, name: 'Older Automation' }, runs: [] }));
    const result = await famulorResources.resourceOptions({ token, resource: resources.find((resource) => resource.path === '/automations'), searchValue: id });
    expect(result.options).toEqual([{ label: `Older Automation (${id})`, value: id }]);
  });
  it.each(resources.filter((resource) => ['/leads', '/scheduled-callbacks'].includes(resource.path)))('finds a $label UUID without sending it to text-only search', async (resource) => {
    const id = '00000000-0000-4000-8000-000000000001';
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(response(Array.from({ length: 100 }, (_, i) => ({ id: `other-${i}`, name: 'Other' })))).mockResolvedValueOnce(response([{ id, name: 'Older Resource' }]));
    const result = await famulorResources.resourceOptions({ token, resource, searchValue: id });
    expect(result.options[0].value).toBe(id);
    expect(send.mock.lastCall[0].queryParams.offset).toBe('100');
    expect(send.mock.calls.every(([req]) => req.queryParams.search === undefined)).toBe(true);
  });
  it.each(resources.filter((resource) => resource.searchParam))('passes $label search to the documented API filter', async (resource) => {
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(response([{ id: 'found', name: 'Search result' }]));
    expect((await famulorResources.resourceOptions({ token, resource, searchValue: 'older' })).options).toHaveLength(1);
    expect(send.mock.lastCall[0].queryParams[resource.searchParam]).toBe('older');
  });
  it('searches accessible contact pages while preserving the API result-cap warning', async () => {
    const id = '00000000-0000-4000-8000-000000000001';
    const page = (data) => ({ status: 200, headers: {}, body: { data, meta: { result_cap_reached: true } } });
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(page(Array.from({ length: 100 }, (_, i) => ({ id: `other-${i}`, name: 'Other' })))).mockResolvedValueOnce(page([{ id, name: 'Older Contact' }]));
    const result = await famulorResources.resourceOptions({ token, resource: resources.find((resource) => resource.path === '/leads'), searchValue: id });
    expect(result.options[0].value).toBe(id);
    expect(result.placeholder).toContain('API capped');
    expect(send.mock.lastCall[0].queryParams.offset).toBe('100');
    expect(send.mock.calls.every(([req]) => req.queryParams.search === undefined)).toBe(true);
  });
  it('propagates permission failures and rejects malformed lists', async () => {
    const send = vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('insufficient_scope'));
    await expect(famulorResources.resourceOptions({ token, resource: resources[0] })).rejects.toThrow('insufficient_scope');
    send.mockResolvedValue(response({ unexpected: [] }));
    await expect(famulorResources.resourceOptions({ token, resource: resources[0] })).rejects.toThrow('invalid resource list');
  });
});
