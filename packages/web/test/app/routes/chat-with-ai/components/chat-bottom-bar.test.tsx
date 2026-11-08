/**
 * @vitest-environment jsdom
 */
import { ActionPreviewEvent } from '@activepieces/shared';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChatBottomBar } from '@/app/routes/chat-with-ai/components/chat-bottom-bar';
import { MultiQuestion } from '@/features/chat/lib/chat-store-types';
import { AnyToolPart } from '@/features/chat/lib/chat-types';

const store = vi.hoisted(() => {
  const selection: Selection = {
    pendingActionPreview: null,
    activeDisplayTool: null,
    activeQuestions: [],
    hasActiveForm: false,
  };
  return {
    selection,
    state: {
      approveGate: vi.fn(),
      rejectGate: vi.fn(),
      dismissForm: vi.fn(),
    },
  };
});

vi.mock('i18next', () => ({
  t: (key: string, params?: Record<string, string>) =>
    key.replace(/\{(\w+)\}/g, (match, name: string) => params?.[name] ?? match),
}));
vi.mock('@/features/chat/lib/chat-store-context', () => ({
  useChatStoreContext: <T,>(selector: (state: typeof store.state) => T) =>
    selector(store.state),
}));
vi.mock('@/features/chat/lib/chat-store', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  chatStoreSelectors: {
    pendingActionPreview: () => store.selection.pendingActionPreview,
    activeDisplayTool: () => store.selection.activeDisplayTool,
    activeQuestions: () => store.selection.activeQuestions,
    hasActiveForm: () => store.selection.hasActiveForm,
  },
}));
vi.mock('@/features/pieces/hooks/pieces-hooks', () => ({
  piecesHooks: {
    usePieceSummary: () => ({ summary: undefined }),
  },
}));
vi.mock('@/features/pieces/components/piece-icon-from-name', () => ({
  PieceIconWithPieceName: () => null,
}));
vi.mock('@/app/routes/chat-with-ai/components/connection-picker-card', () => ({
  ConnectionPickerCard: () => null,
}));
vi.mock('@/app/routes/chat-with-ai/components/project-picker-card', () => ({
  ProjectPickerCard: () => null,
}));

beforeEach(() => {
  store.selection.pendingActionPreview = null;
  store.selection.activeDisplayTool = null;
  store.selection.activeQuestions = [];
  store.selection.hasActiveForm = false;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ChatBottomBar', () => {
  describe('active card priority', () => {
    it('shows the action preview over a display tool and a legacy form', () => {
      setAllCards();
      renderBar();

      expect(screen.getByRole('button', { name: 'Send email' })).toBeTruthy();
      expect(screen.queryByText('Reconnect Linear')).toBeNull();
      expect(screen.queryByText('Which inbox?')).toBeNull();
    });

    it('shows the display tool over a legacy form when there is no action preview', () => {
      setAllCards();
      store.selection.pendingActionPreview = null;
      store.selection.activeQuestions = [QUESTION];
      renderBar();

      expect(screen.getByText('Reconnect Linear')).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Send email' })).toBeNull();
      expect(screen.queryByText('Which inbox?')).toBeNull();
    });

    it('shows the legacy form alone, but not while streaming', () => {
      setLegacyForm();
      renderBar();
      expect(screen.getByText('Which inbox?')).toBeTruthy();
      cleanup();

      renderBar({ isStreaming: true });
      expect(screen.queryByText('Which inbox?')).toBeNull();
    });
  });

  describe('typing a reply dismisses the active card', () => {
    it('rejects the action preview gate', () => {
      store.selection.pendingActionPreview = PREVIEW;
      const { onSend } = renderBar();

      typeAndSend('do something else');

      expect(onSend).toHaveBeenCalledWith('do something else', undefined);
      expect(store.state.rejectGate).toHaveBeenCalledWith('tc-preview');
      expect(store.state.approveGate).not.toHaveBeenCalled();
    });

    it('rejects the display tool gate', () => {
      store.selection.activeDisplayTool = MCP_TOOL;
      const { onSend } = renderBar();

      typeAndSend('skip that');

      expect(onSend).toHaveBeenCalledWith('skip that', undefined);
      expect(store.state.rejectGate).toHaveBeenCalledWith('tc-mcp');
    });

    it('dismisses the legacy form for the last message', () => {
      setLegacyForm();
      const { onSend } = renderBar();

      typeAndSend('neither');

      expect(onSend).toHaveBeenCalledWith('neither', undefined);
      expect(store.state.dismissForm).toHaveBeenCalledWith('msg-last');
    });
  });

  describe('card callbacks', () => {
    it('approves the action preview gate on Run and rejects it on Cancel', () => {
      store.selection.pendingActionPreview = PREVIEW;
      renderBar();

      fireEvent.click(screen.getByRole('button', { name: 'Send email' }));
      expect(store.state.approveGate).toHaveBeenCalledWith('tc-preview');
      cleanup();

      renderBar();
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(store.state.rejectGate).toHaveBeenCalledWith('tc-preview');
    });

    it('sends the legacy form skip text and dismisses the form', () => {
      setLegacyForm();
      const { onSend } = renderBar();

      fireEvent.click(screen.getByRole('button', { name: 'Skip' }));

      expect(store.state.dismissForm).toHaveBeenCalledWith('msg-last');
      expect(onSend).toHaveBeenCalledWith('Skip these questions');
    });
  });
});

function setAllCards() {
  store.selection.pendingActionPreview = PREVIEW;
  store.selection.activeDisplayTool = MCP_TOOL;
  store.selection.activeQuestions = [QUESTION];
  store.selection.hasActiveForm = true;
}

function setLegacyForm() {
  store.selection.activeQuestions = [QUESTION];
  store.selection.hasActiveForm = true;
}

function typeAndSend(text: string) {
  const input = screen.getByPlaceholderText('Or reply in your own words');
  fireEvent.change(input, { target: { value: text } });
  fireEvent.keyDown(input, { key: 'Enter' });
}

function renderBar({ isStreaming = false }: { isStreaming?: boolean } = {}) {
  const onSend = vi.fn();
  render(
    <ChatBottomBar
      isStreaming={isStreaming}
      onSend={onSend}
      onStop={vi.fn()}
      lastAssistantMessage={undefined}
      lastMessageId="msg-last"
    />,
  );
  return { onSend };
}

const PREVIEW: ActionPreviewEvent = {
  toolCallId: 'tc-preview',
  pieceName: '@activepieces/piece-gmail',
  actionName: 'send_email',
  actionDisplayName: 'Send email',
  input: { to: 'dana@example.com' },
  isBatch: false,
};

const MCP_TOOL: AnyToolPart = {
  type: 'dynamic-tool',
  toolName: 'ap_show_mcp_reconnect',
  toolCallId: 'tc-mcp',
  state: 'input-available',
  input: {
    connectorUuid: 'mcp-1',
    displayName: 'Linear',
    connectUrl: 'https://mcp.linear.app/connect',
  },
};

const QUESTION: MultiQuestion = {
  type: 'choice',
  question: 'Which inbox?',
  options: [{ label: 'Gmail' }, { label: 'Outlook' }],
};

type Selection = {
  pendingActionPreview: ActionPreviewEvent | null;
  activeDisplayTool: AnyToolPart | null;
  activeQuestions: MultiQuestion[];
  hasActiveForm: boolean;
};
