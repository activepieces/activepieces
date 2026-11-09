// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { chatDom } from '@/features/chat/lib/chat-dom';
import { chatLayoutUtils } from '@/features/workspace/lib/chat-layout';

describe('chatDom.escapeFree', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('lets Esc reach the chat while a question card shows an inline menu', () => {
    document.body.innerHTML = `
      <aside id="${chatLayoutUtils.PANEL_ID}">
        <div role="menu" aria-label="Pick one"></div>
      </aside>`;

    expect(chatDom.escapeFree(escape())).toBe(true);
  });

  it('leaves Esc to an open overlay', () => {
    document.body.innerHTML = `
      <aside id="${chatLayoutUtils.PANEL_ID}"></aside>
      <div role="menu" data-state="open"></div>`;

    expect(chatDom.escapeFree(escape())).toBe(false);
  });

  it('ignores overlays that are closing', () => {
    document.body.innerHTML = `
      <aside id="${chatLayoutUtils.PANEL_ID}"></aside>
      <div role="dialog" data-state="closed"></div>`;

    expect(chatDom.escapeFree(escape())).toBe(true);
  });

  it('gives Esc to one handler only', () => {
    const event = escape();
    chatDom.claimEscape(event);

    expect(chatDom.escapeFree(event)).toBe(false);
  });
});

function escape(): KeyboardEvent {
  return new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
}
