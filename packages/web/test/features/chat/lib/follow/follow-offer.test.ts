import { beforeEach, describe, expect, it, vi } from 'vitest';

const chat = vi.hoisted(() => ({ conversationId: 'c1' }));

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'current-project' },
}));
vi.mock('@/features/workspace/lib/chat-panel-open', () => ({
  useChatPanel: { getState: () => chat },
}));

import {
  followAlong,
  useFollowAlong,
} from '@/features/chat/lib/follow/follow-along';
import { ResourceRef } from '@/features/chat/lib/resources/registry';

const INITIAL = useFollowAlong.getState();

const leads: ResourceRef = {
  kind: 'table',
  id: 't1',
  projectId: 'current-project',
  name: 'Leads',
};

const editing = {
  target: leads,
  following: true,
  phase: 'editing' as const,
};

const free = {
  state: editing,
  onTarget: false,
  autoFollow: true,
  embedded: false,
  busy: false,
};

describe('followAlong.decide', () => {
  it('opens beside the chat when the page is free, offers when busy', () => {
    expect(followAlong.decide(free)).toBe('open');
    expect(followAlong.decide({ ...free, busy: true })).toBe('offer');
  });

  it('stays put when there is nothing to open or it should not move the page', () => {
    expect(followAlong.decide({ ...free, onTarget: true })).toBe('stay');
    expect(followAlong.decide({ ...free, autoFollow: false })).toBe('stay');
    expect(followAlong.decide({ ...free, embedded: true })).toBe('stay');
    expect(
      followAlong.decide({ ...free, state: { ...editing, following: false } })
    ).toBe('stay');
    expect(
      followAlong.decide({ ...free, state: { ...editing, phase: 'idle' } })
    ).toBe('stay');
    expect(
      followAlong.decide({
        ...free,
        state: { ...editing, target: { ...leads, projectId: 'other' } },
      })
    ).toBe('stay');
  });
});

describe('followAlong offers', () => {
  beforeEach(() => {
    chat.conversationId = 'c1';
    useFollowAlong.setState(INITIAL, true);
  });

  it('keeps one offer per resource, tied to the chat that made it', () => {
    followAlong.offer(leads);
    const first = useFollowAlong.getState().offer;
    followAlong.offer(leads);

    expect(useFollowAlong.getState().offer).toBe(first);
    expect(first).toEqual({ resource: leads, conversationId: 'c1' });

    const renamed = { ...leads, name: 'Hot leads' };
    followAlong.offer(renamed);
    expect(useFollowAlong.getState().offer?.resource).toEqual(renamed);
  });

  it('drops the offer on dismiss and when following stops', () => {
    followAlong.offer(leads);
    followAlong.dismissOffer();
    expect(useFollowAlong.getState().offer).toBeNull();

    followAlong.offer(leads);
    followAlong.stopFollowing();
    expect(useFollowAlong.getState().offer).toBeNull();
  });

  it('drops the offer when the AI deletes what it offered', () => {
    followAlong.offer(leads);
    followAlong.onChunks({
      chunks: [
        {
          type: 'tool-output-available',
          toolCallId: 'call-1',
          output: {
            content: [{ type: 'text', text: 'deleted' }],
            _meta: {
              apResource: {
                v: 1,
                kind: 'table',
                id: 't1',
                projectId: 'current-project',
                op: 'delete',
                label: 'Leads',
              },
            },
          },
        },
      ],
      ctx: { conversationId: 'c1', runId: 'run-1', attach: 'sent' },
    });

    expect(useFollowAlong.getState().offer).toBeNull();
  });
});
