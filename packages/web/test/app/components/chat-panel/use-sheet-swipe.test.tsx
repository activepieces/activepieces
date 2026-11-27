// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { useSheetSwipe } from '@/app/components/chat-panel/use-sheet-swipe';

function Sheet() {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const swipe = useSheetSwipe({
    enabled: true,
    panelRef,
    scrimRef,
    onDismiss: () => undefined,
  });
  return (
    <div ref={panelRef} onPointerDown={swipe.onPointerDown}>
      <p>Chat</p>
    </div>
  );
}

class TestPointerEvent extends MouseEvent {
  readonly pointerId: number;
  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 0;
  }
}

describe('useSheetSwipe', () => {
  beforeAll(() => {
    vi.stubGlobal('PointerEvent', TestPointerEvent);
    vi.stubGlobal(
      'matchMedia',
      (query: string): Pick<MediaQueryList, 'matches' | 'media'> => ({
        matches: false,
        media: query,
      }),
    );
  });

  it('gives text selection back after a two-finger drag', () => {
    render(<Sheet />);
    const sheet = screen.getByText('Chat');

    fireEvent.pointerDown(sheet, { pointerId: 1, clientY: 100, button: 0 });
    fireEvent.pointerDown(sheet, { pointerId: 2, clientY: 100, button: 0 });
    fireEvent.pointerMove(window, { pointerId: 1, clientY: 140 });
    fireEvent.pointerMove(window, { pointerId: 2, clientY: 140 });
    fireEvent.pointerUp(window, { pointerId: 1, clientY: 140 });
    fireEvent.pointerUp(window, { pointerId: 2, clientY: 140 });

    expect(document.body.style.userSelect).toBe('');
  });
});
