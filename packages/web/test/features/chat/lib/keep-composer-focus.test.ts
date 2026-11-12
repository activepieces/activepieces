// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { keepComposerFocus } from '@/features/chat/lib/keep-composer-focus';

describe('keepComposerFocus', () => {
  let composer: HTMLTextAreaElement;
  let pageInput: HTMLInputElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <aside id="ap-chat-panel"><textarea data-chat-composer></textarea></aside>
      <main><input /></main>`;
    composer = document.querySelector('textarea')!;
    pageInput = document.querySelector('input')!;
    composer.focus();
  });

  afterEach(() => {
    pageInput.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  });

  it('hands focus back when the page beside grabs it', () => {
    keepComposerFocus.keep();
    pageInput.focus();
    expect(document.activeElement === composer).toBe(true);
  });

  it('lets the user move focus to the page', () => {
    keepComposerFocus.keep();
    pageInput.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    pageInput.focus();
    expect(document.activeElement === pageInput).toBe(true);
  });

  it('does nothing when the user was not in the chat', () => {
    pageInput.focus();
    keepComposerFocus.keep();
    document.querySelector<HTMLElement>('main')!.tabIndex = -1;
    expect(document.activeElement === pageInput).toBe(true);
  });
});
