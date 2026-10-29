import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockActionContext } from '@activepieces/pieces-framework';
import { letta } from '../src/index';
import { lettaApi, LettaApiError } from '../src/lib/common/client';

const calls = vi.hoisted(() => ({
  agentsList: vi.fn(),
  agentsDelete: vi.fn(),
  agentsUpdate: vi.fn(),
  agentsRetrieve: vi.fn(),
  blocksDetach: vi.fn(),
  messagesReset: vi.fn(),
  messagesList: vi.fn(),
  messagesCreate: vi.fn(),
  rawGet: vi.fn(),
  rawPost: vi.fn(),
  identitiesCreate: vi.fn(),
}));

vi.mock('@letta-ai/letta-client', () => {
  function page<T>(items: T[]) {
    return { getPaginatedItems: () => items };
  }
  class Letta {
    agents = {
      list: async (query: unknown) => page(await calls.agentsList(query)),
      delete: calls.agentsDelete,
      update: calls.agentsUpdate,
      retrieve: calls.agentsRetrieve,
      blocks: { detach: calls.blocksDetach },
      messages: {
        list: async (agentId: string, query: unknown) => page(await calls.messagesList(agentId, query)),
        create: calls.messagesCreate,
        reset: calls.messagesReset,
      },
    };
    identities = { create: calls.identitiesCreate };
    get = calls.rawGet;
    post = calls.rawPost;
  }
  return { Letta };
});

const auth = { type: 'CUSTOM_AUTH', props: { apiKey: 'key', baseUrl: '' } };

function findAction(name: string) {
  const found = letta.getAction(name);
  if (!found) {
    throw new Error(`missing action ${name}`);
  }
  return found;
}

async function runAction({ name, propsValue }: { name: string; propsValue: Record<string, unknown> }) {
  return findAction(name).run({ ...createMockActionContext({ propsValue }), auth });
}

beforeEach(() => {
  Object.values(calls).forEach((fn) => fn.mockReset());
});

describe('metadata', () => {
  it('requires a release that hides ai atomics from old engines', () => {
    expect(letta.minimumSupportedRelease).toBe('0.86.4');
  });

  it('gives every ai atomic aiMetadata, a classification and an outputSchema', () => {
    const atomics = Object.values(letta.actions()).filter((action) => action.audience === 'ai');
    expect(atomics.length).toBe(28);
    for (const action of atomics) {
      expect(action.name.startsWith('letta_')).toBe(true);
      expect(action.aiMetadata?.description.length).toBeGreaterThan(40);
      expect(action.classification).toBeDefined();
      expect(action.outputSchema?.fields.length).toBeGreaterThan(0);
    }
  });

  it('demotes the human twins', () => {
    expect(findAction('sendMessageToAgent').audience).toBe('human');
    expect(findAction('createIdentity').audience).toBe('human');
    expect(findAction('getIdentities').audience).toBe('human');
  });
});

describe('list agents', () => {
  it('sends limit, cursor, order and tag filters and reports the next cursor', async () => {
    calls.agentsList.mockResolvedValue([
      { id: 'agent-1', name: 'a', agent_type: 'letta_v1_agent', tags: [] },
      { id: 'agent-2', name: 'b', agent_type: 'letta_v1_agent', tags: [] },
    ]);
    const result = await runAction({
      name: 'letta_list_agents',
      propsValue: { limit: 2, after: 'agent-0', tags: ['vip'], match_all_tags: 'yes' },
    });
    expect(calls.agentsList).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 2, after: 'agent-0', order: 'desc', tags: ['vip'], match_all_tags: true })
    );
    expect(result).toMatchObject({ count: 2, has_more: true, next_cursor: 'agent-2' });
  });

  it('rejects an out-of-range limit before calling Letta', async () => {
    await expect(runAction({ name: 'letta_list_agents', propsValue: { limit: 500 } })).rejects.toThrow('Limit');
    expect(calls.agentsList).not.toHaveBeenCalled();
  });
});

describe('errors', () => {
  it('keeps the vendor status and body', async () => {
    const vendorError = Object.assign(new Error('404 {"detail":"Agent not found"}'), {
      status: 404,
      error: { detail: 'Agent not found' },
    });
    calls.agentsDelete.mockRejectedValue(vendorError);
    const failure = await runAction({ name: 'letta_delete_agent', propsValue: { agent_id: 'agent-x' } }).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(LettaApiError);
    expect(failure).toMatchObject({ status: 404, responseBody: { detail: 'Agent not found' } });
    expect(String(failure)).toContain('404');
  });
});

describe('send message', () => {
  it('returns the assistant text and usage', async () => {
    calls.messagesCreate.mockResolvedValue({
      messages: [
        { id: 'm1', message_type: 'reasoning_message', reasoning: 'thinking', date: '2026-10-29T10:00:00Z' },
        { id: 'm2', message_type: 'assistant_message', content: 'Hello!', date: '2026-10-29T10:00:01Z' },
      ],
      stop_reason: { stop_reason: 'end_turn' },
      usage: { total_tokens: 12 },
    });
    const result = await runAction({ name: 'letta_send_message', propsValue: { agent_id: 'agent-1', message: 'hi' } });
    expect(calls.messagesCreate).toHaveBeenCalledWith('agent-1', { streaming: false, input: 'hi', max_steps: undefined });
    expect(result).toMatchObject({ assistant_text: 'Hello!', stop_reason: 'end_turn', usage: { total_tokens: 12 } });
  });
});

describe('archival memory', () => {
  it('never returns embedding vectors', async () => {
    calls.rawPost.mockResolvedValue([
      { id: 'passage-1', text: 'remember me', tags: ['a'], embedding: [0.1, 0.2], embedding_config: { dim: 2 }, created_at: '2026-10-29T10:00:00Z' },
    ]);
    const result = await runAction({ name: 'letta_insert_archival_memory', propsValue: { agent_id: 'agent-1', text: 'remember me', tags: ['a'] } });
    expect(calls.rawPost).toHaveBeenCalledWith('/v1/agents/agent-1/archival-memory', { body: { text: 'remember me', tags: ['a'] } });
    expect(JSON.stringify(result)).not.toContain('embedding');
    expect(result).toMatchObject({ count: 1, items: [{ id: 'passage-1', text: 'remember me' }] });
  });

});

describe('identity properties', () => {
  it('refuses a non-numeric number instead of sending NaN', async () => {
    await expect(
      runAction({
        name: 'createIdentity',
        propsValue: { identifierKey: 'u1', name: 'U', identityType: 'user', properties: [{ key: 'age', type: 'number', value: 'abc' }] },
      })
    ).rejects.toThrow('must be a number');
    expect(calls.identitiesCreate).not.toHaveBeenCalled();
  });

  it('parses yes as true for boolean properties', () => {
    expect(lettaApi.parseIdentityProperties([{ key: 'vip', type: 'boolean', value: 'yes' }])).toEqual([
      { key: 'vip', type: 'boolean', value: true },
    ]);
  });
});

describe('new message trigger', () => {
  it('emits assistant messages and legacy send_message calls, newest page only', async () => {
    calls.messagesList.mockResolvedValue([
      { id: 'm3', message_type: 'assistant_message', content: 'new reply', date: '2026-10-29T10:00:03Z' },
      { id: 'm2', message_type: 'tool_call_message', tool_call: { name: 'send_message', arguments: '{}' }, date: '2026-10-29T10:00:02Z' },
      { id: 'm1', message_type: 'user_message', content: 'hi', date: '2026-10-29T10:00:01Z' },
    ]);
    const trigger = letta.getTrigger('newMessage');
    if (!trigger) {
      throw new Error('missing trigger');
    }
    const result = await trigger.test({
      auth,
      propsValue: { agentId: 'agent-1' },
      store: { get: async () => null, put: async () => undefined, delete: async () => undefined },
      files: { write: async () => '' },
    });
    expect(calls.messagesList).toHaveBeenCalledWith('agent-1', { limit: 100, order: 'desc' });
    expect(result.map((message: { id: string }) => message.id)).toEqual(['m3', 'm2']);
  });
});

describe('polling triggers page back to the last seen record', () => {
  const lastPoll = Date.parse('2026-10-29T09:00:00Z');
  const pollStore = { get: async () => lastPoll, put: async () => undefined, delete: async () => undefined } as never;

  function reply(index: number) {
    return {
      id: `m${index}`,
      message_type: 'assistant_message',
      content: `reply ${index}`,
      date: new Date(lastPoll + (index + 1) * 1000).toISOString(),
    };
  }

  function getTrigger(name: string) {
    const trigger = letta.getTrigger(name);
    if (!trigger) {
      throw new Error(`missing trigger ${name}`);
    }
    return trigger;
  }

  it('returns more than 100 new messages spread over two pages and stops at the last seen one', async () => {
    const newest = Array.from({ length: 150 }, (_, i) => reply(149 - i));
    const old = { id: 'old', message_type: 'assistant_message', content: 'seen', date: '2026-10-29T08:59:00Z' };
    calls.messagesList
      .mockResolvedValueOnce(newest.slice(0, 100))
      .mockResolvedValueOnce([...newest.slice(100), old, ...Array.from({ length: 49 }, () => old)]);
    const result = await getTrigger('newMessage').run({
      auth,
      propsValue: { agentId: 'agent-1' },
      store: pollStore,
      files: { write: async () => '' },
    } as never);
    expect(calls.messagesList).toHaveBeenCalledTimes(2);
    expect(calls.messagesList).toHaveBeenNthCalledWith(1, 'agent-1', { limit: 100, order: 'desc' });
    expect(calls.messagesList).toHaveBeenNthCalledWith(2, 'agent-1', { limit: 100, order: 'desc', after: 'm50' });
    expect((result as { id: string }[]).length).toBe(150);
    expect((result as { id: string }[]).some((message) => message.id === 'old')).toBe(false);
  });

  it('stops after 10 pages of new agents', async () => {
    let created = 0;
    calls.agentsList.mockImplementation(async () =>
      Array.from({ length: 100 }, () => {
        created += 1;
        return { id: `agent-${created}`, name: 'a', created_at: new Date(lastPoll + 10_000_000 - created * 1000).toISOString() };
      }),
    );
    const result = await getTrigger('newAgent').run({
      auth,
      propsValue: {},
      store: pollStore,
      files: { write: async () => '' },
    } as never);
    expect(calls.agentsList).toHaveBeenCalledTimes(10);
    expect(calls.agentsList).toHaveBeenLastCalledWith(
      expect.objectContaining({ limit: 100, order: 'desc', order_by: 'created_at', after: 'agent-900' }),
    );
    expect((result as unknown[]).length).toBe(1000);
  });
});

describe('validation messages', () => {
  it('names Max Steps when it is out of range', async () => {
    await expect(
      runAction({ name: 'letta_send_message', propsValue: { agent_id: 'agent-1', message: 'hi', max_steps: 0 } })
    ).rejects.toThrow('Max Steps must be a whole number between 1 and 1000.');
    expect(calls.messagesCreate).not.toHaveBeenCalled();
  });
});

describe('update agent tags', () => {
  it('sends an empty tag list when Clear Tags is yes', async () => {
    calls.agentsUpdate.mockResolvedValue({ id: 'agent-1', name: 'a', agent_type: 'letta_v1_agent', tags: [] });
    await runAction({ name: 'letta_update_agent', propsValue: { agent_id: 'agent-1', clear_tags: 'yes' } });
    expect(calls.agentsUpdate).toHaveBeenCalledWith('agent-1', expect.objectContaining({ tags: [] }));
  });

  it('rejects Clear Tags combined with Tags', async () => {
    await expect(
      runAction({ name: 'letta_update_agent', propsValue: { agent_id: 'agent-1', tags: ['vip'], clear_tags: 'yes' } })
    ).rejects.toThrow('Use either Tags or Clear Tags, not both.');
    expect(calls.agentsUpdate).not.toHaveBeenCalled();
  });

  it('leaves tags untouched when neither is given', async () => {
    calls.agentsUpdate.mockResolvedValue({ id: 'agent-1', name: 'b', agent_type: 'letta_v1_agent', tags: ['x'] });
    await runAction({ name: 'letta_update_agent', propsValue: { agent_id: 'agent-1', name: 'b', clear_tags: 'no' } });
    expect(calls.agentsUpdate).toHaveBeenCalledWith('agent-1', expect.objectContaining({ name: 'b', tags: undefined }));
  });
});

describe('live-test fixes', () => {
  it('gives a short message for a route Letta Cloud removed, keeping status and body', async () => {
    const html = '404 <!DOCTYPE html>\n<html><body><pre>Cannot DELETE /v1/agents/agent-x</pre></body></html>';
    calls.agentsDelete.mockRejectedValue(Object.assign(new Error(html), { status: 404, error: undefined }));
    const failure = await runAction({ name: 'letta_delete_agent', propsValue: { agent_id: 'agent-x' } }).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(LettaApiError);
    expect(failure).toMatchObject({ status: 404, responseBody: html });
    expect(String(failure)).toContain("This endpoint isn't available on your Letta server (Letta Cloud removed it): DELETE /v1/agents/agent-x");
    expect(String(failure)).not.toContain('DOCTYPE');
  });

  it('treats detaching a block that is not attached as success', async () => {
    calls.blocksDetach.mockRejectedValue(
      Object.assign(new Error('404 {"error":"Block block-1 is not attached to agent agent-1"}'), {
        status: 404,
        error: { error: 'Block block-1 is not attached to agent agent-1' },
      })
    );
    calls.agentsRetrieve.mockResolvedValue({ id: 'agent-1', blocks: [{ id: 'block-2', label: 'human' }] });
    const result = await runAction({ name: 'letta_detach_block', propsValue: { agent_id: 'agent-1', block_id: 'block-1' } });
    expect(calls.agentsRetrieve).toHaveBeenCalledWith('agent-1', { include: ['agent.blocks'] });
    expect(result).toEqual({
      agent_id: 'agent-1',
      block_id: 'block-1',
      detached: true,
      already_detached: true,
      blocks: [{ id: 'block-2', label: 'human' }],
    });
  });

  it('still fails detach on other 404s', async () => {
    calls.blocksDetach.mockRejectedValue(Object.assign(new Error('404 {"error":"Agent not found"}'), { status: 404, error: { error: 'Agent not found' } }));
    await expect(runAction({ name: 'letta_detach_block', propsValue: { agent_id: 'agent-1', block_id: 'block-1' } })).rejects.toThrow('Agent not found');
    expect(calls.agentsRetrieve).not.toHaveBeenCalled();
  });

  it('reports a detach that happened as not already detached', async () => {
    calls.blocksDetach.mockResolvedValue({ id: 'agent-1', blocks: [] });
    const result = await runAction({ name: 'letta_detach_block', propsValue: { agent_id: 'agent-1', block_id: 'block-1' } });
    expect(result).toMatchObject({ detached: true, already_detached: false, blocks: [] });
  });

  it('asks list agents for tags', async () => {
    calls.agentsList.mockResolvedValue([]);
    await runAction({ name: 'letta_list_agents', propsValue: {} });
    expect(calls.agentsList).toHaveBeenCalledWith(expect.objectContaining({ include: ['agent.tags'] }));
  });

  it('reset returns no stale message count', async () => {
    calls.messagesReset.mockResolvedValue(null);
    const result = await runAction({ name: 'letta_reset_agent_messages', propsValue: { agent_id: 'agent-1' } });
    expect(result).toEqual({ agent_id: 'agent-1', reset: true });
  });

  it('new agent trigger emits a summary without secrets', async () => {
    calls.agentsList.mockResolvedValue([
      {
        id: 'agent-1',
        name: 'a',
        agent_type: 'letta_v1_agent',
        model: 'letta/auto',
        tags: ['vip'],
        system: 'sys',
        created_at: '2026-10-29T10:00:00Z',
        secrets: [{ key: 'API_KEY', value: 'shh' }],
        tool_exec_environment_variables: [{ key: 'TOKEN', value: 'shh' }],
        llm_config: { model: 'x' },
        message_ids: ['m1'],
      },
    ]);
    const trigger = letta.getTrigger('newAgent');
    if (!trigger) {
      throw new Error('missing trigger');
    }
    const result = await trigger.test({
      auth,
      propsValue: {},
      store: { get: async () => null, put: async () => undefined, delete: async () => undefined },
      files: { write: async () => '' },
    });
    expect(calls.agentsList).toHaveBeenCalledWith(expect.objectContaining({ include: ['agent.tags'], order: 'desc' }));
    expect(JSON.stringify(result)).not.toContain('shh');
    expect(Object.keys(result[0]).sort()).toEqual(
      ['agent_type', 'created_at', 'description', 'embedding', 'id', 'last_run_completion', 'last_stop_reason', 'model', 'name', 'system', 'tags', 'updated_at'].sort()
    );
    expect(result[0]).toMatchObject({ tags: ['vip'], system: 'sys' });
  });
});
