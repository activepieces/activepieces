// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

import { railUtils } from './rail-collapsed';

const base = {
  preference: false,
  pathname: '/projects/p1/flows',
  openedOn: null,
  chatDocked: true,
  viewportWidth: 900,
};

describe('sidebar rail next to the chat dock', () => {
  it('folds to icons while the chat is docked between 768 and 959 px', () => {
    expect(railUtils.railIsOpen(base)).toBe(false);
    expect(railUtils.railIsOpen({ ...base, viewportWidth: 768 })).toBe(false);
  });

  it('stays open when the chat is closed or the screen is wide', () => {
    expect(railUtils.railIsOpen({ ...base, chatDocked: false })).toBe(true);
    expect(railUtils.railIsOpen({ ...base, viewportWidth: 960 })).toBe(true);
  });

  it('leaves phones alone', () => {
    expect(railUtils.railIsOpen({ ...base, viewportWidth: 390 })).toBe(true);
  });

  it('opens when the user opens it on this page', () => {
    expect(
      railUtils.railIsOpen({ ...base, openedOn: '/projects/p1/flows' }),
    ).toBe(true);
  });

  it('stays closed when the user collapsed it', () => {
    expect(
      railUtils.railIsOpen({
        ...base,
        chatDocked: false,
        viewportWidth: 1440,
        preference: true,
      }),
    ).toBe(false);
  });
});
