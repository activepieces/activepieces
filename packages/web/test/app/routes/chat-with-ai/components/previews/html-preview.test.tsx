/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HtmlPreview } from '@/app/routes/chat-with-ai/components/previews/html-preview';

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/components/prompt-kit/code-block', () => ({
  CodeBlockCode: ({ code }: { code: string }) => (
    <pre data-testid="code-body">{code}</pre>
  ),
}));

afterEach(() => {
  cleanup();
});

describe('PreviewCodeTabs in the HTML artifact', () => {
  it('starts on the preview and switches to the code', () => {
    render(<HtmlPreview html="<h2>Welcome, Dana!</h2>" label="Welcome page" />);
    expect(screen.getByTitle('HTML preview')).toBeTruthy();
    expect(screen.queryByTestId('code-body')).toBe(null);

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Code' }), {
      button: 0,
    });
    expect(screen.queryByTitle('HTML preview')).toBe(null);
    expect(screen.getByTestId('code-body').textContent).toBe(
      '<h2>Welcome, Dana!</h2>',
    );

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Preview' }), {
      button: 0,
    });
    expect(screen.getByTitle('HTML preview')).toBeTruthy();
  });

  it('puts the switch and the open-in-new-tab action in the header', () => {
    render(<HtmlPreview html="<p>Hi</p>" />);
    expect(screen.getAllByRole('tab')).toHaveLength(2);
    expect(
      screen.getAllByRole('button', { name: 'Open in new tab' }).length,
    ).toBeGreaterThan(0);
  });
});
