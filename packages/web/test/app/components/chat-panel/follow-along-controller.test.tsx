// @vitest-environment jsdom
import { ApResourceKind } from '@activepieces/core-utils';
import {
  FlowDraftUpdatedEvent,
  ResourceChangeOp,
  WebsocketClientEvent,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FollowAlongController } from '@/app/components/chat-panel/follow-along-controller';
import {
  followAlong,
  useFollowAlong,
} from '@/features/chat/lib/follow/follow-along';
import { followHold } from '@/features/chat/lib/follow/follow-hold';
import { resourceRegistry } from '@/features/chat/lib/resources/registry';
import {
  chatPanelUtils,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';
import { authenticationSession } from '@/lib/authentication-session';

const socketHarness = vi.hoisted(() => {
  const handlers: Record<string, ((payload: unknown) => void)[]> = {};
  return {
    socket: {
      on: (event: string, handler: (payload: unknown) => void) => {
        handlers[event] = [...(handlers[event] ?? []), handler];
      },
      off: (event: string, handler: (payload: unknown) => void) => {
        handlers[event] = (handlers[event] ?? []).filter((h) => h !== handler);
      },
    },
    send: (event: string, payload: unknown) =>
      (handlers[event] ?? []).forEach((handler) => handler(payload)),
  };
});

const flowNames = vi.hoisted(() => {
  const pending = new Map<string, (name: string) => void>();
  return {
    pending,
    resolve: (flowId: string, name: string) => pending.get(flowId)?.(name),
  };
});

const toastSpy = vi.hoisted(() => vi.fn());

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('sonner', () => ({ toast: toastSpy }));
vi.mock('@/components/providers/socket-provider', () => ({
  useSocket: () => socketHarness.socket,
}));
vi.mock('@/features/flows/api/flows-api', () => ({
  flowsApi: {
    get: (flowId: string) =>
      new Promise((resolve) => {
        flowNames.pending.set(flowId, (name) =>
          resolve({ version: { displayName: name } }),
        );
      }),
  },
}));

const run = {
  conversationId: 'chat-1',
  runId: 'run-1',
  attach: 'sent' as const,
};

function push(op: ResourceChangeOp, flowId = 'flow-a') {
  const event: FlowDraftUpdatedEvent = {
    flowId,
    editorSessionId: 'chat-1',
    op,
  };
  act(() => socketHarness.send(WebsocketClientEvent.FLOW_DRAFT_UPDATED, event));
}

async function resolveName(flowId: string, name: string) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    flowNames.resolve(flowId, name);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function DockedController() {
  const open = useChatPanel((s) => s.open);
  return <FollowAlongController chatVisible={open} />;
}

function renderController({
  queryClient,
  path = '/projects/p1/automations',
  controller = <DockedController />,
}: {
  queryClient: QueryClient;
  path?: string;
  controller?: React.ReactNode;
}) {
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>{controller}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('FollowAlongController', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.spyOn(authenticationSession, 'getProjectId').mockReturnValue('p1');
    vi.spyOn(authenticationSession, 'getCurrentUserId').mockReturnValue('u1');
    vi.spyOn(authenticationSession, 'getPlatformId').mockReturnValue('pl1');
    followAlong.reset();
    useChatPanel.setState({
      conversationId: 'chat-1',
      autoFollow: false,
      open: true,
    });
    queryClient = new QueryClient();
    renderController({ queryClient });
    followAlong.startRun(run);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('refreshes the lists as soon as the chat push arrives', () => {
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    push(ResourceChangeOp.UPDATE);

    expect(invalidate).toHaveBeenCalled();
  });

  it('keeps a deleted flow closed when an earlier name lookup finishes late', async () => {
    push(ResourceChangeOp.UPDATE);
    push(ResourceChangeOp.DELETE);

    await resolveName('flow-a', 'Flow A');

    expect(useFollowAlong.getState()).toMatchObject({
      target: null,
      offer: null,
    });
  });

  it('keeps the page held until the click after a press has run', () => {
    vi.useFakeTimers();
    fireEvent.pointerDown(document.body);
    fireEvent.pointerUp(document.body);

    expect(followHold.pagePressed()).toBe(true);
    act(() => vi.runAllTimers());
    expect(followHold.pagePressed()).toBe(false);
    vi.useRealTimers();
  });

  it('handles a delete at once, even while an earlier lookup is pending', () => {
    const onServerChange = vi.spyOn(followAlong, 'onServerChange');
    push(ResourceChangeOp.UPDATE);
    push(ResourceChangeOp.DELETE);
    followAlong.endRun({ conversationId: 'chat-1', runId: 'run-1' });

    expect(onServerChange).toHaveBeenCalledWith(
      expect.objectContaining({ op: ResourceChangeOp.DELETE }),
    );
  });

  it('follows the newest flow when an earlier lookup finishes last', async () => {
    push(ResourceChangeOp.UPDATE, 'flow-a');
    push(ResourceChangeOp.UPDATE, 'flow-b');

    await resolveName('flow-b', 'Flow B');
    await resolveName('flow-a', 'Flow A');
    await resolveName('flow-b', 'Flow B');

    expect(useFollowAlong.getState().target?.id).toBe('flow-b');
  });

  it('keeps following when another tab only changes a saved preference', () => {
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'theme' }));
    });

    expect(followAlong.runOf('chat-1')).toEqual(run);
  });

  it('does not move the page while the chat is closed', async () => {
    const openBeside = vi.spyOn(chatPanelUtils, 'openBeside');
    useChatPanel.setState({ autoFollow: true, open: false });

    push(ResourceChangeOp.UPDATE);
    await resolveName('flow-a', 'Flow A');

    expect(openBeside).not.toHaveBeenCalled();
  });

  it('moves the page beside a full-page chat even though the dock is closed', async () => {
    cleanup();
    const openBeside = vi.spyOn(chatPanelUtils, 'openBeside');
    useChatPanel.setState({ autoFollow: true, open: false });
    renderController({
      queryClient,
      controller: <FollowAlongController chatVisible />,
    });

    push(ResourceChangeOp.UPDATE);
    await resolveName('flow-a', 'Flow A');

    expect(openBeside).toHaveBeenCalled();
  });

  it('still follows an edited flow when another flow is deleted meanwhile', async () => {
    push(ResourceChangeOp.UPDATE, 'flow-b');
    push(ResourceChangeOp.DELETE, 'flow-a');

    await resolveName('flow-b', 'Flow B');

    expect(useFollowAlong.getState().target?.id).toBe('flow-b');
  });

  it('explains the move when the AI deletes a page the user opened', () => {
    cleanup();
    toastSpy.mockClear();
    renderController({
      queryClient,
      path: resourceRegistry.route({
        kind: ApResourceKind.FLOW,
        id: 'flow-a',
        projectId: 'p1',
        name: '',
      }),
    });

    push(ResourceChangeOp.DELETE);

    expect(toastSpy).toHaveBeenCalledWith('The AI deleted this page.');
  });

  it('follows a later flow even when an earlier lookup never returns', async () => {
    push(ResourceChangeOp.UPDATE, 'flow-a');
    push(ResourceChangeOp.UPDATE, 'flow-b');

    await resolveName('flow-b', 'Flow B');

    expect(useFollowAlong.getState().target?.id).toBe('flow-b');
  });

  it('offers the page when the reply ends while the user still presses the page', async () => {
    useChatPanel.setState({ autoFollow: true });
    fireEvent.pointerDown(document.body);
    push(ResourceChangeOp.UPDATE);
    await resolveName('flow-a', 'Flow A');

    act(() => followAlong.endRun({ conversationId: 'chat-1', runId: 'run-1' }));

    expect(useFollowAlong.getState().offer?.resource.id).toBe('flow-a');
  });

  it('drops a pending follow when the user switches to another chat', async () => {
    useChatPanel.setState({ autoFollow: true });
    fireEvent.pointerDown(document.body);
    push(ResourceChangeOp.UPDATE);
    await resolveName('flow-a', 'Flow A');

    act(() => {
      useChatPanel.setState({ conversationId: 'chat-2' });
      followAlong.endRun({ conversationId: 'chat-1', runId: 'run-1' });
    });

    expect(useFollowAlong.getState().offer).toBeNull();
  });
});
