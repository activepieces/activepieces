import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { addAgentKnowledgeProjectAction } from '../src/lib/actions/add-agent-knowledge-project';
import { askAgentAction } from '../src/lib/actions/ask-agent';
import { deleteAgentAction } from '../src/lib/actions/delete-agent';
import { generateAgentAction } from '../src/lib/actions/generate-agent';
import { getAgentAction } from '../src/lib/actions/get-agent';
import { getAgentConversationAction } from '../src/lib/actions/get-agent-conversation';
import { listAgentConversationsAction } from '../src/lib/actions/list-agent-conversations';
import { listAgentsAction } from '../src/lib/actions/list-agents';
import { removeAgentKnowledgeProjectAction } from '../src/lib/actions/remove-agent-knowledge-project';
import { replies, run, stubFetch } from './helpers';

const AGENT = {
	id: 'A1',
	name: 'Helper',
	space_id: 'W',
	data: { description: 'sys', knowledgeEnabled: true, commands: [{ id: 'c1', name: 'Cmd', prompt: 'do', mode: 'default' }] },
};

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('agents', () => {
	test('list_agents drops command prompts and pages', async () => {
		const seen = stubFetch(() => ({ body: { ok: true, items: [AGENT, null] } }));
		const result = await run(listAgentsAction)({ folderId: 'W', limit: 1 });
		expect(seen[0].path).toBe('/folders/W/agents');
		expect(result).toEqual({
			items: [{ id: 'A1', name: 'Helper', spaceId: 'W', description: 'sys', knowledgeEnabled: true, commands: [{ id: 'c1', name: 'Cmd' }] }],
			page: 1,
			nextPage: 2,
			hasMore: true,
		});
	});
	test('get_agent keeps prompts', async () => {
		stubFetch(() => ({ body: { ok: true, item: AGENT } }));
		await expect(run(getAgentAction)({ agentId: 'A1' })).resolves.toMatchObject({ commands: [{ id: 'c1', name: 'Cmd', prompt: 'do' }] });
	});
	test('ask_agent looks up the workspace and calls v2 promptAgent', async () => {
		const seen = stubFetch(replies([{ body: { ok: true, item: AGENT } }, { body: { ok: true, summary: 'Answer' } }]));
		const result = await run(askAgentAction)({ agentId: 'A1', prompt: 'Hi' });
		expect(seen[0].url).toBe('https://www.taskade.com/api/v1/agents/A1');
		expect(seen[1].url).toBe('https://www.taskade.com/api/v2/promptAgent');
		expect(seen[1].body).toEqual({ spaceId: 'W', agentId: 'A1', prompt: 'Hi' });
		expect(result).toEqual({ agentId: 'A1', spaceId: 'W', response: 'Answer' });
	});
	test('ask_agent with a workspace id makes one request', async () => {
		const seen = stubFetch(() => ({ body: { ok: true, summary: 'A' } }));
		await run(askAgentAction)({ agentId: 'A1', prompt: 'Hi', workspaceId: 'W2' });
		expect(seen).toHaveLength(1);
		expect(seen[0].body).toMatchObject({ spaceId: 'W2' });
	});
	test('ask_agent explains a 402', async () => {
		stubFetch(() => ({ status: 402, body: { ok: false, code: 'PAYMENT_REQUIRED', message: 'Out of credits' } }));
		await expect(run(askAgentAction)({ agentId: 'A1', prompt: 'Hi', workspaceId: 'W' })).rejects.toThrow('AI credits');
	});
	test('ask_agent refuses bad ids and empty prompts before any request', async () => {
		const seen = stubFetch(() => ({ body: {} }));
		await expect(run(askAgentAction)({ agentId: '../x', prompt: 'Hi' })).rejects.toThrow('not a valid Agent ID');
		await expect(run(askAgentAction)({ agentId: 'A1', prompt: ' ' })).rejects.toThrow('Prompt is required');
		expect(seen).toHaveLength(0);
	});
	test('list_agent_conversations normalizes items', async () => {
		stubFetch(() => ({ body: { ok: true, items: [{ id: 'c1', space_agent_id: 'A1', status: 'idle', title: 'T', data: {} }] } }));
		await expect(run(listAgentConversationsAction)({ agentId: 'A1' })).resolves.toMatchObject({
			items: [{ id: 'c1', agentId: 'A1', status: 'idle', title: 'T' }],
			hasMore: false,
		});
	});
	test('get_agent_conversation caps the transcript', async () => {
		const seen = stubFetch(() => ({ body: { ok: true, item: { id: 'c1', space_agent_id: 'A1' }, transcript: 'x'.repeat(100_010) } }));
		const result = await run(getAgentConversationAction)({ agentId: 'A1', conversationId: 'c1' });
		expect(seen[0].url).toBe('https://www.taskade.com/api/v2/getConversation');
		expect(seen[0].body).toEqual({ agentId: 'A1', convoId: 'c1', includeTranscript: true });
		expect(result).toMatchObject({ truncated: true });
		expect(String(Reflect.get(Object(result), 'transcript')).length).toBe(100_000);
	});
	test('get_agent_conversation without transcript', async () => {
		stubFetch(() => ({ body: { ok: true, item: { id: 'c1' } } }));
		await expect(run(getAgentConversationAction)({ agentId: 'A1', conversationId: 'c1', includeTranscript: false })).resolves.toMatchObject({
			transcript: null,
			truncated: false,
		});
	});
	test('generate_agent posts the description', async () => {
		const seen = stubFetch(() => ({ body: { ok: true, item: AGENT } }));
		await expect(run(generateAgentAction)({ folderId: 'W', description: 'An agent' })).resolves.toMatchObject({ id: 'A1' });
		expect(seen[0].path).toBe('/folders/W/agent-generate');
		expect(seen[0].body).toEqual({ text: 'An agent' });
	});
	test('delete_agent: 404 is already deleted, other errors are thrown', async () => {
		stubFetch(() => ({ status: 404, body: { ok: false, message: 'Not Found' } }));
		await expect(run(deleteAgentAction)({ agentId: 'A1' })).resolves.toEqual({ agentId: 'A1', deleted: true, alreadyDeleted: true });
		stubFetch(() => ({ status: 500, body: { ok: false, message: 'boom' } }));
		await expect(run(deleteAgentAction)({ agentId: 'A1' })).rejects.toThrow('boom');
	});
	test('knowledge add and remove', async () => {
		const seen = stubFetch(() => ({ body: { ok: true, item: AGENT } }));
		await expect(run(addAgentKnowledgeProjectAction)({ agentId: 'A1', projectId: 'https://www.taskade.com/d/P1' })).resolves.toEqual({ agentId: 'A1', projectId: 'P1', linked: true });
		expect(seen[0].body).toEqual({ projectId: 'P1' });
		await expect(run(removeAgentKnowledgeProjectAction)({ agentId: 'A1', projectId: 'P1' })).resolves.toEqual({ agentId: 'A1', projectId: 'P1', linked: false });
		expect(seen[1].method).toBe('DELETE');
		expect(seen[1].path).toBe('/agents/A1/knowledge/project/P1');
	});
	test('knowledge remove: 404 with an existing agent still succeeds, with a missing agent fails', async () => {
		stubFetch((request) => (request.method === 'DELETE' ? { status: 404, body: { ok: false } } : { body: { ok: true, item: AGENT } }));
		await expect(run(removeAgentKnowledgeProjectAction)({ agentId: 'A1', projectId: 'P1' })).resolves.toMatchObject({ linked: false });
		stubFetch(() => ({ status: 404, body: { ok: false, message: 'Not Found' } }));
		await expect(run(removeAgentKnowledgeProjectAction)({ agentId: 'A1', projectId: 'P1' })).rejects.toThrow('get agent failed');
	});
});
