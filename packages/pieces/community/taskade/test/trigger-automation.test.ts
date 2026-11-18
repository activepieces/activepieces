import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { triggerAutomationAction } from '../src/lib/actions/trigger-automation';
import { run, stubFetch, TOKEN } from './helpers';

const URL_OK = 'https://www.taskade.com/webhooks/automation/abc123';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('trigger_automation', () => {
	test('posts the payload without the personal access token', async () => {
		const seen = stubFetch(() => ({ body: { ok: true } }));
		await expect(run(triggerAutomationAction)({ webhookUrl: URL_OK, payload: { name: 'Jane' } })).resolves.toEqual({ status: 200, ok: true });
		expect(seen[0].url).toBe(URL_OK);
		expect(seen[0].method).toBe('POST');
		expect(seen[0].body).toEqual({ name: 'Jane' });
		expect(seen[0].auth).toBeNull();
		expect(JSON.stringify([...seen[0].headers])).not.toContain(TOKEN);
	});
	test('sends the webhook bearer token when given', async () => {
		const seen = stubFetch(() => ({ body: {} }));
		await run(triggerAutomationAction)({ webhookUrl: URL_OK, bearerToken: 'hook-secret' });
		expect(seen[0].auth).toBe('Bearer hook-secret');
		expect(seen[0].body).toEqual({});
	});
	test.each([
		'http://www.taskade.com/webhooks/x',
		'https://www.taskade.com.evil.io/webhooks/x',
		'https://evil.io/webhooks/x',
		'https://user:pass@www.taskade.com/webhooks/x',
		'https://www.taskade.com:8443/webhooks/x',
		'https://www.taskade.com/api/v1/workspaces',
		'not a url',
	])('refuses %s before any request', async (webhookUrl) => {
		const seen = stubFetch(() => ({ body: {} }));
		await expect(run(triggerAutomationAction)({ webhookUrl })).rejects.toThrow('must be a Taskade webhook URL');
		expect(seen).toHaveLength(0);
	});
	test('refuses non-object payloads', async () => {
		stubFetch(() => ({ body: {} }));
		await expect(run(triggerAutomationAction)({ webhookUrl: URL_OK, payload: '[1,2]' })).rejects.toThrow('JSON object');
		await expect(run(triggerAutomationAction)({ webhookUrl: URL_OK, payload: '{bad' })).rejects.toThrow('valid JSON');
	});
	test.each([
		[401, 'Webhook Bearer Token'],
		[404, 'copy the current URL'],
		[402, 'Pro plan'],
		[500, 'HTTP 500'],
	])('HTTP %s is explained', async (status, message) => {
		stubFetch(() => ({ status, body: { ok: false } }));
		await expect(run(triggerAutomationAction)({ webhookUrl: URL_OK })).rejects.toThrow(message);
	});
});
