// @vitest-environment jsdom
import { BuildPlanEvent } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import {
  BuildState,
  chatBuildUtils,
  createChatStore,
} from '@/features/chat/lib/chat-store';

function event(override: Partial<BuildPlanEvent>): BuildPlanEvent {
  return {
    buildId: 'build_1',
    phase: 'building',
    flowName: 'Lead triage',
    steps: [{ id: 'trigger', label: 'Trigger', status: 'pending' }],
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...override,
  };
}

describe('chatBuildUtils.mergeBuildPlan', () => {
  it('inserts a new build', () => {
    const merged = chatBuildUtils.mergeBuildPlan({ builds: {}, event: event({}) });
    expect(merged['build_1'].phase).toBe('building');
  });

  it('ignores stale events with an older updatedAt', () => {
    const builds: Record<string, BuildState> = {
      build_1: { ...event({ phase: 'done' }), updatedAt: '2026-01-01T00:05:00.000Z' },
    };
    const merged = chatBuildUtils.mergeBuildPlan({
      builds,
      event: event({ phase: 'building', updatedAt: '2026-01-01T00:01:00.000Z' }),
    });
    expect(merged).toBe(builds);
    expect(merged['build_1'].phase).toBe('done');
  });

  it('applies newer events', () => {
    const builds: Record<string, BuildState> = {
      build_1: event({}),
    };
    const merged = chatBuildUtils.mergeBuildPlan({
      builds,
      event: event({ phase: 'done', flowId: 'flow_42', updatedAt: '2026-01-01T00:05:00.000Z' }),
    });
    expect(merged['build_1'].phase).toBe('done');
    expect(merged['build_1'].flowId).toBe('flow_42');
  });
});

describe('chat store build state', () => {
  it('resetInteractions keeps builds (they are conversation-scoped, not per-turn)', () => {
    const store = createChatStore();
    store.setState({ builds: { build_1: event({}) } });
    store.getState().resetInteractions();
    expect(store.getState().builds).toEqual({ build_1: event({}) });
  });

  it('resetBuilds clears builds', () => {
    const store = createChatStore();
    store.setState({ builds: { build_1: event({}) } });
    store.getState().resetBuilds();
    expect(store.getState().builds).toEqual({});
  });
});
