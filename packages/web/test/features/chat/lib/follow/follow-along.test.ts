// @vitest-environment jsdom
import { ApResourceKind } from '@activepieces/core-utils';
import { ResourceChangeOp } from '@activepieces/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { aiHighlightKey } from '@/features/chat/lib/follow/ai-highlight-key';
import {
  followAlong,
  RunContext,
  useFollowAlong,
} from '@/features/chat/lib/follow/follow-along';
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';
import { authenticationSession } from '@/lib/authentication-session';

const run: RunContext = {
  runId: 'run-1',
  conversationId: 'chat-1',
  attach: 'sent',
};

function change({
  id,
  op,
  runId,
}: {
  id: string;
  op: ResourceChangeOp;
  runId: string;
}) {
  const live = { ...run, runId };
  followAlong.startRun(live);
  followAlong.onServerChange({
    resource: { kind: ApResourceKind.FLOW, id, projectId: 'p1', name: id },
    op,
    run: live,
  });
}

describe('followAlong', () => {
  beforeEach(() => {
    followAlong.reset();
    useChatPanel.setState({ conversationId: 'chat-1' });
  });

  it('does not reopen the last edited flow when a later run only deletes', () => {
    change({ id: 'flow-a', op: ResourceChangeOp.UPDATE, runId: 'run-1' });
    followAlong.endRun({ conversationId: 'chat-1', runId: 'run-1' });

    change({ id: 'flow-b', op: ResourceChangeOp.DELETE, runId: 'run-2' });

    expect(useFollowAlong.getState().target).toBeNull();
  });

  it('drops the Open offer for a page the AI deletes', () => {
    change({ id: 'flow-a', op: ResourceChangeOp.UPDATE, runId: 'run-1' });
    followAlong.offer({
      resource: {
        kind: ApResourceKind.FLOW,
        id: 'flow-a',
        projectId: 'p1',
        name: 'flow-a',
      },
      runId: 'run-1',
    });
    followAlong.endRun({ conversationId: 'chat-1', runId: 'run-1' });

    change({ id: 'flow-a', op: ResourceChangeOp.DELETE, runId: 'run-2' });

    expect(useFollowAlong.getState().offer).toBeNull();
  });

  it('follows only server changes made by a live run of this tab', () => {
    expect(followAlong.runOf('chat-1')).toBeNull();
    followAlong.startRun(run);
    expect(followAlong.runOf('chat-1')).toEqual(run);
    expect(followAlong.runOf('chat-2')).toBeNull();
    expect(followAlong.runOf(null)).toBeNull();
    followAlong.endRun({ conversationId: 'chat-1', runId: 'run-1' });
    expect(followAlong.runOf('chat-1')).toBeNull();
  });

  it('ignores a change that arrives after the run ended', () => {
    followAlong.startRun(run);
    followAlong.endRun({ conversationId: 'chat-1', runId: 'run-1' });

    followAlong.onServerChange({
      resource: {
        kind: ApResourceKind.FLOW,
        id: 'flow-a',
        projectId: 'p1',
        name: 'flow-a',
      },
      op: ResourceChangeOp.UPDATE,
      run,
    });

    expect(useFollowAlong.getState()).toMatchObject({
      target: null,
      phase: 'idle',
    });
  });

  it('shares the run history entry when the user accepts an offer', () => {
    followAlong.offer({
      resource: {
        kind: ApResourceKind.FLOW,
        id: 'flow-a',
        projectId: 'p1',
        name: 'flow-a',
      },
      runId: 'run-1',
    });

    followAlong.acceptOffer();

    expect(followAlong.claimHistoryPush('run-1')).toBe(false);
  });

  it('remembers a step the chat changed on a flow the user is not on', () => {
    vi.spyOn(authenticationSession, 'getProjectId').mockReturnValue('p1');

    runTool({ callId: 'call-1', stepName: 'step_1', wrote: true });

    const resource = { kind: ApResourceKind.FLOW, id: 'flow-a' };
    const key = aiHighlightKey.step('step_1');
    expect(followAlong.takeUnseen({ resource, key })).toBe(true);
    expect(followAlong.takeUnseen({ resource, key })).toBe(false);
  });

  it('does not mark a step when the tool changed nothing', () => {
    vi.spyOn(authenticationSession, 'getProjectId').mockReturnValue('p1');

    runTool({ callId: 'call-1', stepName: 'step_1', wrote: false });

    const resource = { kind: ApResourceKind.FLOW, id: 'flow-a' };
    expect(
      followAlong.takeUnseen({ resource, key: aiHighlightKey.step('step_1') }),
    ).toBe(false);
  });

  it('sheens the steps of a followed flow the user is already on', () => {
    vi.spyOn(authenticationSession, 'getProjectId').mockReturnValue('p1');
    change({ id: 'flow-a', op: ResourceChangeOp.UPDATE, runId: 'run-1' });
    window.history.pushState({}, '', '/projects/p1/flows/flow-a');

    runTool({ callId: 'call-2', stepName: 'step_2', wrote: true });
    window.history.pushState({}, '', '/');

    expect(Object.keys(useFollowAlong.getState().flashes)).toEqual([
      aiHighlightKey.step('step_2'),
    ]);
  });

  it('marks a step when the push arrives before the tool input', () => {
    vi.spyOn(authenticationSession, 'getProjectId').mockReturnValue('p1');

    followAlong.noteWrite({ kind: ApResourceKind.FLOW, id: 'flow-a' });
    runTool({ callId: 'call-3', stepName: 'step_4', wrote: false });

    expect(
      followAlong.takeUnseen({
        resource: { kind: ApResourceKind.FLOW, id: 'flow-a' },
        key: aiHighlightKey.step('step_4'),
      }),
    ).toBe(true);
  });

  it('marks both steps when two pushes arrive before their results', () => {
    vi.spyOn(authenticationSession, 'getProjectId').mockReturnValue('p1');
    const flow = { kind: ApResourceKind.FLOW, id: 'flow-a' };
    followAlong.noteWrite(flow);
    followAlong.noteWrite(flow);

    runTool({ callId: 'call-5', stepName: 'step_5', wrote: false });
    runTool({ callId: 'call-6', stepName: 'step_6', wrote: false });

    expect(
      followAlong.takeUnseen({
        resource: flow,
        key: aiHighlightKey.step('step_5'),
      }),
    ).toBe(true);
    expect(
      followAlong.takeUnseen({
        resource: flow,
        key: aiHighlightKey.step('step_6'),
      }),
    ).toBe(true);
  });

  it('lets a read-only tool leave the pending write to the edit', () => {
    vi.spyOn(authenticationSession, 'getProjectId').mockReturnValue('p1');
    const flow = { kind: ApResourceKind.FLOW, id: 'flow-a' };
    followAlong.onChunks([
      {
        type: 'tool-input-available',
        toolCallId: 'call-read',
        toolName: 'ap_read_step_settings',
        input: { flowId: 'flow-a', stepName: 'step_8' },
      },
      {
        type: 'tool-input-available',
        toolCallId: 'call-edit',
        toolName: 'ap_update_step',
        input: { flowId: 'flow-a', stepName: 'step_8' },
      },
    ]);
    followAlong.noteWrite(flow);
    followAlong.onChunks([
      { type: 'tool-output-available', toolCallId: 'call-read', output: {} },
      { type: 'tool-output-available', toolCallId: 'call-edit', output: {} },
    ]);

    expect(
      followAlong.takeUnseen({
        resource: flow,
        key: aiHighlightKey.step('step_8'),
      }),
    ).toBe(true);
  });

  it('marks the router a branch tool changed', () => {
    vi.spyOn(authenticationSession, 'getProjectId').mockReturnValue('p1');
    const flow = { kind: ApResourceKind.FLOW, id: 'flow-a' };
    followAlong.onChunks([
      {
        type: 'tool-input-available',
        toolCallId: 'call-7',
        toolName: 'ap_add_branch',
        input: { flowId: 'flow-a', routerStepName: 'router_1' },
      },
    ]);
    followAlong.noteWrite(flow);
    followAlong.onChunks([
      { type: 'tool-output-available', toolCallId: 'call-7', output: {} },
    ]);

    expect(
      followAlong.takeUnseen({
        resource: flow,
        key: aiHighlightKey.step('router_1'),
      }),
    ).toBe(true);
  });

  it('plays one sheen when the same step is flashed twice in a row', () => {
    const key = aiHighlightKey.step('step_3');

    followAlong.flash([key]);
    const first = useFollowAlong.getState().flashes[key];
    followAlong.flash([key]);

    expect(useFollowAlong.getState().flashes[key]).toBe(first);
  });
});

function runTool({
  callId,
  stepName,
  wrote,
}: {
  callId: string;
  stepName: string;
  wrote: boolean;
}) {
  followAlong.onChunks([
    {
      type: 'tool-input-available',
      toolCallId: callId,
      toolName: 'ap_update_step',
      input: { flowId: 'flow-a', stepName },
    },
  ]);
  if (wrote) followAlong.noteWrite({ kind: ApResourceKind.FLOW, id: 'flow-a' });
  followAlong.onChunks([
    { type: 'tool-output-available', toolCallId: callId, output: {} },
  ]);
}
