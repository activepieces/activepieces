/**
 * @vitest-environment jsdom
 */
import { act, cleanup, render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  KeepBottomOnFooterGrowth,
  MatchScrollGutter,
} from '@/app/routes/chat-with-ai/components/chat-scroll-sync';

const mocks = vi.hoisted(() => ({
  scrollToBottom: vi.fn(),
  isAtBottom: true,
  scroller: { current: null as HTMLDivElement | null },
  observers: [] as Array<() => void>,
}));

vi.mock('use-stick-to-bottom', () => ({
  useStickToBottomContext: () => ({
    isAtBottom: mocks.isAtBottom,
    scrollToBottom: mocks.scrollToBottom,
    scrollRef: mocks.scroller,
  }),
}));

function setSize({
  element,
  name,
  value,
}: {
  element: HTMLElement;
  name: 'offsetHeight' | 'offsetWidth' | 'clientWidth';
  value: number;
}) {
  Object.defineProperty(element, name, { configurable: true, value });
}

function Harness({ withGutter }: { withGutter: boolean }) {
  const footerRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <div data-testid="footer" ref={footerRef} />
      {withGutter ? (
        <MatchScrollGutter footerRef={footerRef} />
      ) : (
        <KeepBottomOnFooterGrowth footerRef={footerRef} />
      )}
    </>
  );
}

function resizeAll() {
  act(() => mocks.observers.forEach((notify) => notify()));
}

describe('chat scroll sync', () => {
  beforeEach(() => {
    mocks.scrollToBottom.mockReset();
    mocks.isAtBottom = true;
    mocks.observers = [];
    mocks.scroller.current = null;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          mocks.observers.push(callback);
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('scrolls to the bottom when the footer grows while at the bottom', () => {
    const { getByTestId } = render(<Harness withGutter={false} />);
    const footer = getByTestId('footer');
    setSize({ element: footer, name: 'offsetHeight', value: 200 });
    resizeAll();
    expect(mocks.scrollToBottom).toHaveBeenCalledWith('instant');
  });

  it('leaves the scroll alone when the footer shrinks', () => {
    const { getByTestId } = render(<Harness withGutter={false} />);
    const footer = getByTestId('footer');
    setSize({ element: footer, name: 'offsetHeight', value: 200 });
    resizeAll();
    mocks.scrollToBottom.mockReset();
    setSize({ element: footer, name: 'offsetHeight', value: 120 });
    resizeAll();
    expect(mocks.scrollToBottom).not.toHaveBeenCalled();
  });

  it('leaves the scroll alone when the reader scrolled up', () => {
    mocks.isAtBottom = false;
    const { getByTestId } = render(<Harness withGutter={false} />);
    setSize({
      element: getByTestId('footer'),
      name: 'offsetHeight',
      value: 200,
    });
    resizeAll();
    expect(mocks.scrollToBottom).not.toHaveBeenCalled();
  });

  it('gives the footer the transcript scrollbar gutter', () => {
    const scroller = document.createElement('div');
    setSize({ element: scroller, name: 'offsetWidth', value: 320 });
    setSize({ element: scroller, name: 'clientWidth', value: 309 });
    mocks.scroller.current = scroller;
    const { getByTestId, unmount } = render(<Harness withGutter />);
    const footer = getByTestId('footer');
    expect(footer.style.getPropertyValue('--chat-scroll-gutter')).toBe('11px');
    unmount();
    expect(footer.style.getPropertyValue('--chat-scroll-gutter')).toBe('');
  });
});
