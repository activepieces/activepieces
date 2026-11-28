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

describe('chatDom.shortcutOf', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it.each([
    [{ key: 'j', metaKey: true }, 'toggle'],
    [{ key: 'j', ctrlKey: true }, 'toggle'],
    [{ key: 'O', metaKey: true, shiftKey: true }, 'newChat'],
    [{ key: 'H', ctrlKey: true, shiftKey: true }, 'history'],
    [{ key: 'j', metaKey: true, altKey: true }, null],
    [{ key: 'j' }, null],
  ])('reads %o as %s', (init, expected) => {
    const event = new KeyboardEvent('keydown', init);
    expect(chatDom.shortcutOf(event)).toBe(expected);
  });

  it('leaves the keys to a code editor that has focus', () => {
    document.body.innerHTML = `
      <div class="cm-editor"><div contenteditable="true"></div></div>`;
    const editor = document.querySelector('[contenteditable]');
    const event = new KeyboardEvent('keydown', {
      key: 'j',
      metaKey: true,
      bubbles: true,
    });
    const seen: Array<string | null> = [];
    editor?.addEventListener('keydown', (e) => {
      if (e instanceof KeyboardEvent) seen.push(chatDom.shortcutOf(e));
    });
    editor?.dispatchEvent(event);
    expect(seen).toEqual([null]);
  });
});

describe('chatDom.isCardField', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('keeps Esc in a card input from stopping the reply', () => {
    document.body.innerHTML = `
      <form aria-label="Question"><input aria-label="Answer" /></form>
      <textarea data-chat-composer aria-label="Composer"></textarea>`;

    expect(chatDom.isCardField(document.querySelector('input'))).toBe(true);
    expect(chatDom.isCardField(document.querySelector('textarea'))).toBe(false);
    expect(chatDom.isCardField(document.body)).toBe(false);
  });
});

function escape(): KeyboardEvent {
  return new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
}
