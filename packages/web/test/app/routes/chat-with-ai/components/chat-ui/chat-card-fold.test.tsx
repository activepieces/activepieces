/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ChatCard,
  ChatCardFold,
} from '@/app/routes/chat-with-ai/components/chat-ui/chat-card';

vi.mock('i18next', () => ({ t: (key: string) => key }));

afterEach(() => {
  cleanup();
});

describe('ChatCardFold', () => {
  it('starts folded and opens with the chevron', () => {
    renderFold({ defaultOpen: false });
    expect(screen.queryByText('Email: dana@northwind.io')).toBe(null);

    fireEvent.click(screen.getByRole('button', { name: 'Show details' }));
    expect(screen.getByText('Email: dana@northwind.io')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Hide details' }));
    expect(screen.queryByText('Email: dana@northwind.io')).toBe(null);
  });

  it('starts open when asked', () => {
    renderFold({ defaultOpen: true });
    expect(screen.getByText('Email: dana@northwind.io')).toBeTruthy();
  });

  it('keeps its state when defaultOpen changes after mount', () => {
    const { rerender } = renderFold({ defaultOpen: true });
    rerender(<Fold defaultOpen={false} />);
    expect(screen.getByText('Email: dana@northwind.io')).toBeTruthy();
  });
});

function renderFold({ defaultOpen }: { defaultOpen: boolean }) {
  return render(<Fold defaultOpen={defaultOpen} />);
}

function Fold({ defaultOpen }: { defaultOpen: boolean }) {
  return (
    <ChatCard>
      <ChatCardFold
        defaultOpen={defaultOpen}
        tile={<span />}
        title="Created contact Dana Park"
        meta="HubSpot · 2:32 PM"
      >
        <p>Email: dana@northwind.io</p>
      </ChatCardFold>
    </ChatCard>
  );
}
