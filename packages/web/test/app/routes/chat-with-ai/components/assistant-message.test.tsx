/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AssistantMessage } from '@/app/routes/chat-with-ai/components/assistant-message';
import { MessageBlock } from '@/app/routes/chat-with-ai/lib/message-blocks';
import { ToolCallMeta } from '@/features/chat/lib/chat-store';
import {
  ChatStoreProvider,
  useChatStoreApi,
} from '@/features/chat/lib/chat-store-context';
import { AnyToolPart, ChatUIMessage } from '@/features/chat/lib/chat-types';

const fixture = vi.hoisted(() => {
  const value: { blocks: MessageBlock[] } = { blocks: [] };
  return value;
});

vi.mock('i18next', () => ({
  t: (key: string, params?: Record<string, string | number>) =>
    key.replace(/\{(\w+)\}/g, (_, name: string) =>
      String(params?.[name] ?? ''),
    ),
}));
vi.mock(
  '@/app/routes/chat-with-ai/lib/message-blocks',
  async (importOriginal) => ({
    ...(await importOriginal<object>()),
    buildMessageBlocks: () => ({
      blocks: fixture.blocks,
      hasContent: true,
      sources: [{ key: 's1', href: 'https://example.com', title: 'Example' }],
    }),
  }),
);
vi.mock('@/features/pieces', () => ({
  piecesHooks: {
    usePiece: () => ({ pieceModel: undefined, isLoading: false }),
  },
}));
vi.mock('@/features/pieces/hooks/pieces-hooks', () => ({
  piecesHooks: {
    usePiece: () => ({ pieceModel: undefined, isLoading: false }),
    usePieceSummary: () => ({ summary: undefined }),
    usePieceSummariesByNames: () => ({ summaries: [] }),
  },
}));
vi.mock('@/features/pieces/components/piece-icon-from-name', () => ({
  PieceIconWithPieceName: () => null,
}));
vi.mock('@/features/projects', () => ({
  projectCollectionUtils: { useAll: () => ({ data: [] }) },
  getProjectName: (project: { displayName: string }) => project.displayName,
  ApProjectDisplay: ({ title }: { title: string }) => <span>{title}</span>,
}));
vi.mock('@/hooks/user-hooks', () => ({
  userHooks: { useCurrentUser: () => ({ data: undefined }) },
}));
vi.mock('@/app/connections/create-edit-connection-dialog', () => ({
  CreateOrEditConnectionDialog: () => null,
}));
vi.mock('@/lib/navigation-utils', () => ({
  useNewWindow: () => vi.fn(),
}));
vi.mock('@/features/chat/lib/chat-api', () => ({
  chatApi: {
    getPickerConnections: async () => ({
      connections: [],
      reconnectOnly: false,
    }),
    submitMessageFeedback: async () => undefined,
  },
}));

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('a,b\n1,2', { status: 200 })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('AssistantMessage smoke', () => {
  it('renders every block kind, from history and while streaming', () => {
    expect(new Set(collectKinds(ALL_BLOCKS)).size).toBe(12);
    fixture.blocks = ALL_BLOCKS;

    const { unmount } = renderMessage({ isStreaming: false });
    expect(screen.getByText('Here is what I found.')).toBeTruthy();
    expect(screen.getByText('Sources')).toBeTruthy();
    unmount();

    renderMessage({ isStreaming: true });
    expect(
      screen.getByText('Memory updated: Likes short replies'),
    ).toBeTruthy();
  });
});

function renderMessage({ isStreaming }: { isStreaming: boolean }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ChatStoreProvider>
          <SeedStore />
          <AssistantMessage
            message={MESSAGE}
            isStreaming={isStreaming}
            onSendPrompt={vi.fn()}
            conversationId="conversation-1"
            messageIndex={1}
          />
        </ChatStoreProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function SeedStore() {
  const store = useChatStoreApi();
  useState(() => {
    store.setState({
      conversationId: 'conversation-1',
      toolCallMeta: TOOL_CALL_META,
      builds: {
        'build-1': {
          buildId: 'build-1',
          flowId: 'flow-1',
          flowName: 'Lead greeting',
          phase: 'building',
          steps: [{ id: 's1', label: 'Add trigger', status: 'in_progress' }],
          updatedAt: TIMESTAMP,
        },
      },
    });
    return true;
  });
  return null;
}

function collectKinds(blocks: MessageBlock[]): string[] {
  return blocks.flatMap((block) => {
    if (block.kind === 'card-group') {
      return [block.kind, ...block.cards.map((card) => card.kind)];
    }
    if (block.kind === 'build-plan') {
      return [block.kind, ...collectKinds(block.children ?? [])];
    }
    return [block.kind];
  });
}

function toolPart({
  name,
  id,
  input = {},
  output,
}: {
  name: string;
  id: string;
  input?: Record<string, unknown>;
  output?: unknown;
}): AnyToolPart {
  if (output === undefined) {
    return {
      type: 'dynamic-tool',
      toolName: name,
      toolCallId: id,
      state: 'input-available',
      input,
    };
  }
  return {
    type: 'dynamic-tool',
    toolName: name,
    toolCallId: id,
    state: 'output-available',
    input,
    output,
  };
}

const TIMESTAMP = '2026-11-08T10:00:00.000Z';

const SEARCH_TOOL = toolPart({
  name: 'ap_search_pieces',
  id: 'tc-search',
  input: { query: 'gmail' },
  output: { pieces: [] },
});

const ALL_BLOCKS: MessageBlock[] = [
  {
    kind: 'thinking',
    steps: [
      { kind: 'reasoning', text: 'Need to check the inbox first.' },
      { kind: 'tool', part: SEARCH_TOOL, description: 'Looking for Gmail' },
    ],
    trailingReasoningText: '',
  },
  { kind: 'text', text: 'Here is what I found.' },
  {
    kind: 'display-tool',
    part: toolPart({
      name: 'ap_show_mcp_reconnect',
      id: 'tc-mcp',
      input: {
        connectorUuid: 'mcp-1',
        displayName: 'Linear',
        connectUrl: 'https://mcp.linear.app/connect',
      },
      output: { reconnected: true },
    }),
  },
  {
    kind: 'display-tool',
    part: toolPart({
      name: 'ap_show_connection_picker',
      id: 'tc-conn',
      input: { piece: 'slack', displayName: 'Slack' },
      output: { label: 'Work Slack' },
    }),
  },
  {
    kind: 'display-tool',
    part: toolPart({
      name: 'ap_show_project_picker',
      id: 'tc-project',
      input: { suggestedProjects: [{ id: 'p1', name: 'Marketing' }] },
      output: { projectId: 'p1' },
    }),
  },
  {
    kind: 'display-tool',
    part: toolPart({
      name: 'ap_show_showcase',
      id: 'tc-showcase',
      input: {
        headline: 'Ideas for you',
        layout: 'list',
        tiles: [{ title: 'Daily digest', prompt: 'Send me a daily digest' }],
      },
      output: {},
    }),
  },
  {
    kind: 'display-tool',
    part: toolPart({
      name: 'ap_show_questions',
      id: 'tc-questions',
      input: { questions: [] },
      output: { answers: '- **Which inbox?** Gmail' },
    }),
  },
  { kind: 'memory-saved', memory: 'Likes short replies' },
  {
    kind: 'batch-progress',
    data: {
      label: 'Sending emails',
      total: 3,
      completed: 2,
      succeeded: 1,
      failed: 1,
      done: false,
      results: [
        { index: 0, success: true },
        { index: 1, success: false, error: 'Invalid address' },
      ],
    },
  },
  {
    kind: 'tasks',
    tasks: [
      {
        toolCallId: 'tc-task',
        part: toolPart({ name: 'ap_run_subagents', id: 'tc-task' }),
        output: undefined,
        subject: 'Research leads',
      },
    ],
  },
  { kind: 'action-receipt', toolCallId: 'tc-receipt' },
  { kind: 'image', toolCallId: 'tc-image' },
  { kind: 'files', toolCallId: 'tc-files' },
  {
    kind: 'card-group',
    cards: [
      { kind: 'action-receipt', toolCallId: 'tc-receipt' },
      { kind: 'image', toolCallId: 'tc-image' },
    ],
  },
  {
    kind: 'card-skeleton',
    cardKind: 'action-receipt',
    toolCallId: 'tc-pending',
    part: toolPart({
      name: 'ap_execute_action',
      id: 'tc-pending',
      input: { pieceName: '@activepieces/piece-gmail', actionName: 'send' },
    }),
    description: 'Sending the email',
    phase: 'pending',
  },
  {
    kind: 'build-plan',
    buildId: 'build-1',
    phase: 'building',
    children: [{ kind: 'text', text: 'Adding the trigger.' }],
  },
];

const TOOL_CALL_META: Record<string, ToolCallMeta> = {
  'tc-receipt': {
    actionReceipt: {
      toolCallId: 'tc-receipt',
      actionDisplayName: 'Send email',
      pieceName: '@activepieces/piece-gmail',
      status: 'success',
      output: { id: 'm1' },
      timestamp: TIMESTAMP,
    },
  },
  'tc-image': {
    image: {
      toolCallId: 'tc-image',
      fileId: 'f-image',
      url: 'https://example.com/image.png',
      mediaType: 'image/png',
      prompt: 'A cat',
      timestamp: TIMESTAMP,
    },
  },
  'tc-files': {
    files: [
      {
        toolCallId: 'tc-files',
        fileId: 'f-csv',
        url: 'https://example.com/leads.csv',
        mediaType: 'text/csv',
        fileName: 'leads.csv',
        byteSize: 8,
        timestamp: TIMESTAMP,
      },
    ],
  },
  'tc-task:0': {
    subagent: {
      title: 'Research leads',
      status: 'running',
      stepCount: 2,
      startedAt: TIMESTAMP,
    },
  },
};

const MESSAGE: ChatUIMessage = {
  id: 'hist-1',
  role: 'assistant',
  parts: [{ type: 'text', text: 'Here is what I found.' }],
};
