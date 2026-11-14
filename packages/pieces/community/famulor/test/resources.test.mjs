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
  it.each(['+491701234567', '1701234567'])('finds calls by phone number %s through bounded server-filtered history requests', async (searchValue) => {
    const id = '00000000-0000-4000-8000-000000000001';
    const call = { id, to_number: '+491701234567', transcript: 'Hello', summary: 'Appointment confirmed' };
    const send = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (req) => {
      if (req.url.endsWith('/history')) return response(req.queryParams.type === 'call' ? [{ id, channel: 'call', contact: call.to_number, from: null, to: call.to_number, summary: call.summary }] : []);
      if (req.queryParams.q) return response([]);
      return response(Number(req.queryParams.offset) === 0
        ? Array.from({ length: 100 }, (_, i) => ({ id: `other-${i}`, to_number: '+493012345678' }))
        : [call]);
    });
    const props = famulorResources.resourceProperty({ field: { name: 'id', in: 'path', required: true }, operation: operationById('getCall') });
    const result = await props.options({ auth: { secret_text: token } }, { searchValue });
    expect(result.options).toEqual([{ label: `+491701234567 (${id})`, value: id }]);
    expect(send.mock.calls.length).toBeLessThanOrEqual(4);
    expect(send.mock.calls.every(([req]) => req.method === 'GET' && req.url.endsWith('/history') && req.queryParams.search === searchValue && req.queryParams.offset === '0')).toBe(true);
    expect(send.mock.calls.map(([req]) => req.queryParams.type)).toEqual(['call', 'avatar', 'live_chat', 'whatsapp_voice']);
  });
  it('bounds broad call searches to 100 filtered choices without scanning unrelated pages', async () => {
    const send = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async () => response(Array.from({ length: 100 }, (_, i) => ({ id: `call-${i}`, channel: 'call', contact: '+491701234567', to: '+491701234567' }))));
    const result = await famulorResources.resourceOptions({ token, resource: resources.find((resource) => resource.path === '/calls'), searchValue: '+49' });
    expect(result.options).toHaveLength(100);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.lastCall[0].url).toBe('https://app.famulor.io/api/v1/history');
    expect(send.mock.lastCall[0].queryParams).toMatchObject({ type: 'call', search: '+49', limit: '100', offset: '0' });
  });
  it.each([1, 100])('preserves an API cap warning with %s call choices in the actual dropdown', async (count) => {
    const rows = Array.from({ length: count }, (_, i) => ({ id: `call-${i}`, channel: 'call', contact: '+491701234567' }));
    const send = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (req) => req.queryParams.type === 'call'
      ? { status: 200, headers: {}, body: { data: rows, meta: { result_cap_reached: true } } }
      : response([]));
    const props = famulor.actions().getCall.props.path_id;
    const result = await props.options({ auth: { secret_text: token } }, { searchValue: '+49' });
    expect(result.options).toHaveLength(count);
    expect(result.placeholder).toContain('API capped');
    expect(result.placeholder).toContain('exact call UUID');
    expect(send.mock.calls.length).toBeLessThanOrEqual(4);
  });
  it('warns about unread history matches even when channel overlap leaves fewer than 100 choices', async () => {
    const rows = Array.from({ length: 60 }, (_, i) => ({ id: `call-${i}`, channel: 'live_chat', contact: '+491701234567' }));
    const send = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (req) => {
      const data = req.queryParams.type === 'avatar' ? rows : req.queryParams.type === 'live_chat' ? rows.slice(0, 40) : [];
      return { status: 200, headers: {}, body: { data, meta: { pagination: { total: req.queryParams.type === 'live_chat' ? 70 : data.length, limit: Number(req.queryParams.limit), offset: 0 } } } };
    });
    const result = await famulor.actions().getCall.props.path_id.options({ auth: { secret_text: token } }, { searchValue: '+49' });
    expect(result.options).toHaveLength(60);
    expect(result.placeholder).toContain('More matching calls');
    expect(result.placeholder).toContain('exact call UUID');
    expect(send).toHaveBeenCalledTimes(4);
  });
  it('does not show a limit notice for complete, short call search results', async () => {
    const send = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (req) => {
      const data = req.queryParams.type === 'call' ? [{ id: 'call-1', channel: 'call', contact: '+491701234567' }] : [];
      return { status: 200, headers: {}, body: { data, meta: { result_cap_reached: false, pagination: { total: data.length, limit: Number(req.queryParams.limit), offset: 0 } } } };
    });
    const result = await famulor.actions().getCall.props.path_id.options({ auth: { secret_text: token } }, { searchValue: '+49' });
    expect(result.options).toHaveLength(1);
    expect(result.placeholder).toBeUndefined();
    expect(send).toHaveBeenCalledTimes(4);
  });
  it('keeps call-backed history channels, deduplicates overlapping rows and displays inbound callers', async () => {
    const send = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (req) => response([
      { id: req.queryParams.type, channel: req.queryParams.type, contact: '+491701234567', from: '+491701234567', to: '+493012345678' },
      { id: 'overlap', channel: 'live_chat', contact: 'Shared conversation' },
      { id: 'email-id', channel: 'email', contact: 'someone@example.com' },
      { channel: 'call', contact: 'Missing ID' },
    ]));
    const result = await famulorResources.resourceOptions({ token, resource: resources.find((resource) => resource.path === '/calls'), searchValue: 'Appointment' });
    expect(result.options.map((option) => option.value)).toEqual(['call', 'overlap', 'avatar', 'live_chat', 'whatsapp_voice']);
    expect(result.options[0].label).toBe('+491701234567 (call)');
    expect(send.mock.calls.map(([req]) => req.queryParams.limit)).toEqual(['100', '98', '97', '96']);
  });
  it('looks up an exact call UUID directly without running a history search', async () => {
    const id = '00000000-0000-4000-8000-000000000001';
    const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(response({ id, to_number: '+491701234567' }));
    const props = famulorResources.resourceProperty({ field: { name: 'id', in: 'path', required: true }, operation: operationById('getCall') });
    expect((await props.options({ auth: { secret_text: token } }, { searchValue: id })).options).toEqual([{ label: `+491701234567 (${id})`, value: id }]);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.lastCall[0].url).toBe(`https://app.famulor.io/api/v1/calls/${id}`);
  });
  it.each(['permission', 'malformed response'])('rejects history search %s failures without falling back to an unfiltered scan', async (failure) => {
    const send = vi.spyOn(httpClient, 'sendRequest');
    if (failure === 'permission') send.mockRejectedValue(new Error('insufficient_scope'));
    else send.mockResolvedValue(response({ unexpected: [] }));
    await expect(famulorResources.resourceOptions({ token, resource: resources.find((resource) => resource.path === '/calls'), searchValue: '+49' })).rejects.toThrow(failure === 'permission' ? 'insufficient_scope' : 'invalid resource list');
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.lastCall[0].url).toBe('https://app.famulor.io/api/v1/history');
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
