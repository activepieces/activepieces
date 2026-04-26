import { describe, expect, it, vi } from 'vitest';

// Mock all modules with side-effects or DOM/React dependencies before imports
vi.mock('@/lib/api', () => ({ API_URL: 'http://localhost:3000' }));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: {
    getToken: () => 'test-token',
    getProjectId: () => 'test-project',
  },
}));
vi.mock('@/features/chat/lib/chat-api', () => ({
  chatApi: {
    createConversation: vi.fn(),
    getMessages: vi.fn(),
  },
}));
vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(() => ({
    messages: [],
    status: 'idle',
    sendMessage: vi.fn(),
    stop: vi.fn(),
    setMessages: vi.fn(),
    error: null,
  })),
}));
vi.mock('ai', () => ({
  DefaultChatTransport: vi.fn().mockImplementation(() => ({})),
}));

import {
  convertUIMessagesToItems,
  deriveToolStatus,
  extractDynamicToolOutput,
  mapHistoryToUIMessages,
} from '@/features/chat/lib/use-chat';

import type { ChatHistoryMessage } from '@activepieces/shared';
import type { UIMessage } from 'ai';

// ---------------------------------------------------------------------------
// deriveToolStatus
// ---------------------------------------------------------------------------

describe('deriveToolStatus', () => {
  it('returns "completed" for "output-available"', () => {
    expect(deriveToolStatus('output-available')).toBe('completed');
  });

  it('returns "failed" for "output-error"', () => {
    expect(deriveToolStatus('output-error')).toBe('failed');
  });

  it('returns "running" for "input-streaming"', () => {
    expect(deriveToolStatus('input-streaming')).toBe('running');
  });

  it('returns "running" for "input-available"', () => {
    expect(deriveToolStatus('input-available')).toBe('running');
  });

  it('returns "running" for any unknown state', () => {
    expect(deriveToolStatus('something-else')).toBe('running');
    expect(deriveToolStatus('')).toBe('running');
  });
});

// ---------------------------------------------------------------------------
// extractDynamicToolOutput
// ---------------------------------------------------------------------------

describe('extractDynamicToolOutput', () => {
  it('returns string output when state is "output-available" and output is a string', () => {
    const result = extractDynamicToolOutput({
      state: 'output-available',
      output: 'tool result text',
    });
    expect(result).toBe('tool result text');
  });

  it('JSON-stringifies object output when state is "output-available"', () => {
    const output = { key: 'value', count: 42 };
    const result = extractDynamicToolOutput({
      state: 'output-available',
      output,
    });
    expect(result).toBe(JSON.stringify(output));
  });

  it('returns errorText when state is "output-error" and errorText is present', () => {
    const result = extractDynamicToolOutput({
      state: 'output-error',
      errorText: 'something went wrong',
    });
    expect(result).toBe('something went wrong');
  });

  it('returns undefined when state is "output-error" but errorText is absent', () => {
    const result = extractDynamicToolOutput({ state: 'output-error' });
    expect(result).toBeUndefined();
  });

  it('returns undefined when state is "output-available" but output is undefined', () => {
    const result = extractDynamicToolOutput({
      state: 'output-available',
      output: undefined,
    });
    expect(result).toBeUndefined();
  });

  it('returns undefined for other states regardless of output presence', () => {
    const result = extractDynamicToolOutput({
      state: 'input-streaming',
      output: 'irrelevant',
    });
    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// convertUIMessagesToItems
// ---------------------------------------------------------------------------

function makeUIMessage(
  role: 'user' | 'assistant' | 'system' | 'tool',
  parts: UIMessage['parts'],
  id = 'msg-1',
): UIMessage {
  return { id, role, parts } as UIMessage;
}

describe('convertUIMessagesToItems', () => {
  it('returns empty array for empty input', () => {
    expect(convertUIMessagesToItems([])).toEqual([]);
  });

  it('converts a user message with text to a ChatMessageItem', () => {
    const msgs = [
      makeUIMessage('user', [{ type: 'text', text: 'Hello!' }]),
    ];
    const items = convertUIMessagesToItems(msgs);
    expect(items).toHaveLength(1);
    expect(items[0].role).toBe('user');
    expect(items[0].blocks).toEqual([{ type: 'text', text: 'Hello!' }]);
    expect(items[0].thoughts).toBe('');
  });

  it('converts an assistant message with text and reasoning', () => {
    const msgs = [
      makeUIMessage('assistant', [
        { type: 'reasoning', text: 'Let me think...' },
        { type: 'text', text: 'Here is the answer.' },
      ]),
    ];
    const items = convertUIMessagesToItems(msgs);
    expect(items[0].thoughts).toBe('Let me think...');
    expect(items[0].blocks).toEqual([
      { type: 'text', text: 'Here is the answer.' },
    ]);
  });

  it('merges consecutive text parts into a single text block', () => {
    const msgs = [
      makeUIMessage('assistant', [
        { type: 'text', text: 'First ' },
        { type: 'text', text: 'second.' },
      ]),
    ];
    const items = convertUIMessagesToItems(msgs);
    expect(items[0].blocks).toEqual([{ type: 'text', text: 'First second.' }]);
  });

  it('does not merge text parts interrupted by a tool call', () => {
    const msgs = [
      makeUIMessage('assistant', [
        { type: 'text', text: 'Before' },
        {
          type: 'dynamic-tool',
          toolCallId: 'tc1',
          toolName: 'build_flow',
          title: 'Build flow',
          state: 'output-available',
          input: {},
          output: 'ok',
        },
        { type: 'text', text: 'After' },
      ]),
    ];
    const items = convertUIMessagesToItems(msgs);
    expect(items[0].blocks).toHaveLength(3);
    expect(items[0].blocks[0]).toEqual({ type: 'text', text: 'Before' });
    expect(items[0].blocks[1].type).toBe('tool_calls');
    expect(items[0].blocks[2]).toEqual({ type: 'text', text: 'After' });
  });

  it('groups consecutive dynamic-tool parts into a single tool_calls block', () => {
    const msgs = [
      makeUIMessage('assistant', [
        {
          type: 'dynamic-tool',
          toolCallId: 'tc1',
          toolName: 'build_flow',
          title: 'Build flow',
          state: 'output-available',
          input: {},
          output: 'result1',
        },
        {
          type: 'dynamic-tool',
          toolCallId: 'tc2',
          toolName: 'add_step',
          title: 'Add step',
          state: 'output-available',
          input: {},
          output: 'result2',
        },
      ]),
    ];
    const items = convertUIMessagesToItems(msgs);
    expect(items[0].blocks).toHaveLength(1);
    expect(items[0].blocks[0].type).toBe('tool_calls');
    if (items[0].blocks[0].type === 'tool_calls') {
      expect(items[0].blocks[0].calls).toHaveLength(2);
    }
  });

  it('filters out messages with "system" role', () => {
    const msgs = [
      makeUIMessage('system', [{ type: 'text', text: 'System prompt' }]),
      makeUIMessage('user', [{ type: 'text', text: 'User message' }], 'msg-2'),
    ];
    const items = convertUIMessagesToItems(msgs);
    expect(items).toHaveLength(1);
    expect(items[0].role).toBe('user');
  });

  it('filters out messages with "tool" role', () => {
    const msgs = [
      makeUIMessage('tool', [{ type: 'text', text: 'Tool response' }]),
    ];
    expect(convertUIMessagesToItems(msgs)).toHaveLength(0);
  });

  it('includes file names from file parts', () => {
    const msgs = [
      makeUIMessage('user', [
        { type: 'text', text: 'See attached' },
        {
          type: 'file',
          filename: 'report.pdf',
          url: 'data:application/pdf;base64,abc',
          mediaType: 'application/pdf',
        },
      ]),
    ];
    const items = convertUIMessagesToItems(msgs);
    expect(items[0].fileNames).toEqual(['report.pdf']);
  });

  it('derives tool status from dynamic-tool state', () => {
    const msgs = [
      makeUIMessage('assistant', [
        {
          type: 'dynamic-tool',
          toolCallId: 'tc1',
          toolName: 'build_flow',
          title: 'Build flow',
          state: 'output-error',
          input: {},
          errorText: 'failed!',
        },
      ]),
    ];
    const items = convertUIMessagesToItems(msgs);
    const toolBlock = items[0].blocks[0];
    if (toolBlock.type === 'tool_calls') {
      expect(toolBlock.calls[0].status).toBe('failed');
      expect(toolBlock.calls[0].output).toBe('failed!');
    }
  });
});

// ---------------------------------------------------------------------------
// mapHistoryToUIMessages
// ---------------------------------------------------------------------------

describe('mapHistoryToUIMessages', () => {
  it('returns empty array for empty history', () => {
    expect(mapHistoryToUIMessages([])).toEqual([]);
  });

  it('converts a user message with content to a UIMessage', () => {
    const history: ChatHistoryMessage[] = [
      { role: 'user', content: 'Hello there!' },
    ];
    const uiMessages = mapHistoryToUIMessages(history);
    expect(uiMessages).toHaveLength(1);
    expect(uiMessages[0].role).toBe('user');
    const textPart = uiMessages[0].parts.find((p) => p.type === 'text');
    expect(textPart).toBeDefined();
    if (textPart && textPart.type === 'text') {
      expect(textPart.text).toBe('Hello there!');
    }
  });

  it('emits a reasoning part when thoughts are present', () => {
    const history: ChatHistoryMessage[] = [
      { role: 'assistant', content: 'My answer', thoughts: 'Thinking...' },
    ];
    const uiMessages = mapHistoryToUIMessages(history);
    const reasoningPart = uiMessages[0].parts.find(
      (p) => p.type === 'reasoning',
    );
    expect(reasoningPart).toBeDefined();
    if (reasoningPart && reasoningPart.type === 'reasoning') {
      expect(reasoningPart.text).toBe('Thinking...');
    }
  });

  it('does not emit reasoning part when thoughts is absent', () => {
    const history: ChatHistoryMessage[] = [
      { role: 'assistant', content: 'My answer' },
    ];
    const uiMessages = mapHistoryToUIMessages(history);
    const reasoningPart = uiMessages[0].parts.find(
      (p) => p.type === 'reasoning',
    );
    expect(reasoningPart).toBeUndefined();
  });

  it('maps a completed tool call to a dynamic-tool part with output-available state', () => {
    const history: ChatHistoryMessage[] = [
      {
        role: 'assistant',
        content: '',
        toolCalls: [
          {
            toolCallId: 'tc1',
            title: 'Build Flow',
            status: 'completed',
            input: { flowName: 'My flow' },
            output: 'flow-id-123',
          },
        ],
      },
    ];
    const uiMessages = mapHistoryToUIMessages(history);
    const toolPart = uiMessages[0].parts.find((p) => p.type === 'dynamic-tool');
    expect(toolPart).toBeDefined();
    if (toolPart && toolPart.type === 'dynamic-tool') {
      expect(toolPart.state).toBe('output-available');
      expect(toolPart.toolCallId).toBe('tc1');
      expect(toolPart.output).toBe('flow-id-123');
    }
  });

  it('maps a failed tool call to a dynamic-tool part with output-error state', () => {
    const history: ChatHistoryMessage[] = [
      {
        role: 'assistant',
        content: '',
        toolCalls: [
          {
            toolCallId: 'tc2',
            title: 'Add Step',
            status: 'failed',
            output: 'Something broke',
          },
        ],
      },
    ];
    const uiMessages = mapHistoryToUIMessages(history);
    const toolPart = uiMessages[0].parts.find((p) => p.type === 'dynamic-tool');
    expect(toolPart).toBeDefined();
    if (toolPart && toolPart.type === 'dynamic-tool') {
      expect(toolPart.state).toBe('output-error');
      if (toolPart.state === 'output-error') {
        expect(toolPart.errorText).toBe('Something broke');
      }
    }
  });

  it('uses "Tool call failed" as errorText when tool output is not a string', () => {
    const history: ChatHistoryMessage[] = [
      {
        role: 'assistant',
        content: '',
        toolCalls: [
          {
            toolCallId: 'tc3',
            title: 'Add Step',
            status: 'failed',
            // output is undefined (not a string)
          },
        ],
      },
    ];
    const uiMessages = mapHistoryToUIMessages(history);
    const toolPart = uiMessages[0].parts.find((p) => p.type === 'dynamic-tool');
    if (toolPart && toolPart.type === 'dynamic-tool' && toolPart.state === 'output-error') {
      expect(toolPart.errorText).toBe('Tool call failed');
    }
  });

  it('assigns stable ids using index prefix "hist-{idx}"', () => {
    const history: ChatHistoryMessage[] = [
      { role: 'user', content: 'Msg 1' },
      { role: 'assistant', content: 'Msg 2' },
    ];
    const uiMessages = mapHistoryToUIMessages(history);
    expect(uiMessages[0].id).toBe('hist-0');
    expect(uiMessages[1].id).toBe('hist-1');
  });

  it('converts multiple messages preserving order', () => {
    const history: ChatHistoryMessage[] = [
      { role: 'user', content: 'First' },
      { role: 'assistant', content: 'Second' },
      { role: 'user', content: 'Third' },
    ];
    const uiMessages = mapHistoryToUIMessages(history);
    expect(uiMessages).toHaveLength(3);
    expect(uiMessages[0].role).toBe('user');
    expect(uiMessages[1].role).toBe('assistant');
    expect(uiMessages[2].role).toBe('user');
  });
});
