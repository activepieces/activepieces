/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

import { GlobalErrorBoundary } from '@/app/components/global-error-boundary';

const Boom = () => {
  throw new Error('bootstrap exploded');
};

function renderCrashedApp() {
  render(
    <GlobalErrorBoundary>
      <Boom />
    </GlobalErrorBoundary>
  );
}

type WriteText = (text: string) => Promise<void>;

function setClipboard(writeText: WriteText | undefined) {
  Object.defineProperty(navigator, 'clipboard', {
    value: writeText === undefined ? undefined : { writeText },
    configurable: true,
  });
}

describe('GlobalErrorBoundary fallback outside every provider', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the diagnostics without a provider in the tree and without a click', () => {
    renderCrashedApp();

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Technical Details')).toBeTruthy();
    expect(document.body.textContent).toContain('Message: bootstrap exploded');
    expect(document.body.textContent).toContain('Stack:');
  });

  it('keeps query-string secrets out of the diagnostics', () => {
    window.history.pushState({}, '', '/authenticate?response=super-secret-jwt');

    renderCrashedApp();

    expect(document.body.textContent).toContain(
      'URL: http://localhost:3000/authenticate'
    );
    expect(document.body.textContent).not.toContain('super-secret-jwt');
  });

  it('keeps the recovery actions reachable', () => {
    renderCrashedApp();

    expect(screen.getByText('Reload page')).toBeTruthy();
    expect(screen.getByText('Go to home')).toBeTruthy();
  });

  it('copies the diagnostics and flashes the copied state back to idle', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const writeText = vi.fn<WriteText>(() => Promise.resolve());
    setClipboard(writeText);

    renderCrashedApp();
    fireEvent.click(screen.getByLabelText('Copy'));
    await act(async () => undefined);

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain('Message: bootstrap exploded');
    expect(screen.getByText('Copied')).toBeTruthy();

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText('Technical Details')).toBeTruthy();
  });

  it('says so when the clipboard is unavailable instead of failing silently', async () => {
    setClipboard(undefined);

    renderCrashedApp();
    fireEvent.click(screen.getByLabelText('Copy'));
    await act(async () => undefined);

    expect(screen.getByText('Failed to copy to clipboard')).toBeTruthy();
  });

  it('says so when the clipboard write is rejected', async () => {
    setClipboard(() => Promise.reject(new Error('denied')));

    renderCrashedApp();
    fireEvent.click(screen.getByLabelText('Copy'));
    await act(async () => undefined);

    expect(screen.getByText('Failed to copy to clipboard')).toBeTruthy();
  });

  it('keeps the latest copy result visible when clicked twice in quick succession', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setClipboard(vi.fn<WriteText>(() => Promise.resolve()));

    renderCrashedApp();
    fireEvent.click(screen.getByLabelText('Copy'));
    await act(async () => undefined);

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    fireEvent.click(screen.getByLabelText('Copy'));
    await act(async () => undefined);

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByText('Copied')).toBeTruthy();

    await act(async () => {
      vi.advanceTimersByTime(1600);
    });

    expect(screen.getByText('Technical Details')).toBeTruthy();
  });
});
