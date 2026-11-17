/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Markdown } from '@/components/prompt-kit/markdown';

vi.mock('@/components/prompt-kit/code-block', () => ({
  CodeBlock: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CodeBlockGroup: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CodeBlockCode: ({ code }: { code: string }) => (
    <pre data-testid="code">{code}</pre>
  ),
}));

afterEach(() => {
  cleanup();
});

describe('Markdown code blocks', () => {
  it('keeps # comment lines in a code block as written', () => {
    render(<Markdown>{SCRIPT}</Markdown>);

    expect(screen.getByTestId('code').textContent?.trimEnd()).toBe(
      'echo start\n# install deps\nnpm install',
    );
  });

  it('still renders a heading written right under a line of text', () => {
    render(<Markdown>{'Some intro\n## Setup'}</Markdown>);

    expect(screen.getByRole('heading', { name: 'Setup' })).toBeTruthy();
  });
});

const SCRIPT = [
  'Run this:',
  '',
  '```bash',
  'echo start',
  '# install deps',
  'npm install',
  '```',
].join('\n');
