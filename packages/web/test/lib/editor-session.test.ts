/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';

describe('the Editor Session of a page load', () => {
  it('keeps one Editor Session id for the whole page load', async () => {
    const editorSession = await loadEditorSessionOfNewPage();

    expect(editorSession.getId()).not.toBe('');
    expect(editorSession.getId()).toBe(editorSession.getId());
  });

  it('makes a new Editor Session id on a new page load', async () => {
    const firstPageSession = await loadEditorSessionOfNewPage();
    const secondPageSession = await loadEditorSessionOfNewPage();

    expect(secondPageSession.getId()).not.toBe(firstPageSession.getId());
  });

  it('keeps the Editor Session id out of browser storage', async () => {
    const editorSession = await loadEditorSessionOfNewPage();

    const storedValues = [window.localStorage, window.sessionStorage].flatMap(
      (storage) =>
        Array.from({ length: storage.length }, (_, index) =>
          storage.getItem(storage.key(index) ?? ''),
        ),
    );
    expect(storedValues).not.toContain(editorSession.getId());
  });
});

async function loadEditorSessionOfNewPage() {
  vi.resetModules();
  const { editorSession } = await import('@/lib/editor-session');
  return editorSession;
}
