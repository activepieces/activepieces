// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/features/workspace/lib/use-chat-on', () => ({
  useChatOn: () => true,
}));

import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';
import { railUtils } from '@/features/workspace/lib/rail-collapsed';

const pathname = '/projects/p1/flows';
const base = {
  state: { preference: false, foldedForChat: false, openedOn: null },
  pathname,
  chatPage: false,
  chatOn: true,
};

describe('railIsOpen', () => {
  it('is open by default', () => {
    expect(railUtils.railIsOpen(base)).toBe(true);
  });

  it('stays closed while folded for the chat, except on the chat page', () => {
    const state = { ...base.state, foldedForChat: true };
    expect(railUtils.railIsOpen({ ...base, state })).toBe(false);
    expect(railUtils.railIsOpen({ ...base, state, chatPage: true })).toBe(true);
  });

  it('stays open on pages without the chat, like the platform admin', () => {
    const state = { ...base.state, foldedForChat: true };
    expect(
      railUtils.railIsOpen({
        ...base,
        state,
        pathname: '/platform/users',
        chatOn: false,
      }),
    ).toBe(true);
  });

  it('stays closed when the user collapsed it', () => {
    const state = { ...base.state, preference: true };
    expect(railUtils.railIsOpen({ ...base, state })).toBe(false);
  });
});

describe('folding the rail for the dock', () => {
  beforeEach(() => {
    useChatPanel.setState({ open: false });
    railUtils.store.setState({
      preference: false,
      foldedForChat: false,
      openedOn: null,
    });
  });

  it.each([800, 1440, 1920])('folds when the chat docks at %ipx', (width) => {
    window.innerWidth = width;
    useChatPanel.getState().setOpen(true);
    expect(railUtils.store.getState().foldedForChat).toBe(true);
    expect(sessionStorage.getItem('primary-rail-folded-for-chat')).toBe('true');
  });

  it('unfolds when the chat closes', () => {
    window.innerWidth = 1440;
    useChatPanel.getState().setOpen(true);
    useChatPanel.getState().setOpen(false);
    expect(railUtils.store.getState().foldedForChat).toBe(false);
  });

  it('leaves phones alone', () => {
    window.innerWidth = 390;
    useChatPanel.getState().setOpen(true);
    expect(railUtils.store.getState().foldedForChat).toBe(false);
  });

  it('folds again when the chat is docked again', () => {
    window.innerWidth = 1440;
    useChatPanel.getState().setOpen(true);
    railUtils.store.setState({ foldedForChat: false });
    useChatPanel.getState().dock('left');
    expect(railUtils.store.getState().foldedForChat).toBe(true);
  });
});
