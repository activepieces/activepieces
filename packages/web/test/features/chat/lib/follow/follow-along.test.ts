// @vitest-environment jsdom
import { ApResourceKind } from '@activepieces/core-utils';
import { ResourceChangeOp } from '@activepieces/shared';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  followAlong,
  RunContext,
  useFollowAlong,
} from '@/features/chat/lib/follow/follow-along';
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';

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
});
