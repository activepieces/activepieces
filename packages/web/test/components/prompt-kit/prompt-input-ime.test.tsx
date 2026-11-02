/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  PromptInput,
  PromptInputTextarea,
} from '@/components/prompt-kit/prompt-input';

afterEach(() => {
  cleanup();
});

describe('PromptInputTextarea Enter', () => {
  it('does not send while an IME is still composing', () => {
    const onSubmit = renderPrompt();

    fireEvent.keyDown(screen.getByRole('textbox'), {
      key: 'Enter',
      isComposing: true,
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('sends on a plain Enter', () => {
    const onSubmit = renderPrompt();

    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

function renderPrompt() {
  const onSubmit = vi.fn();
  render(
    <PromptInput value="nihao" onSubmit={onSubmit}>
      <PromptInputTextarea />
    </PromptInput>,
  );
  return onSubmit;
}
