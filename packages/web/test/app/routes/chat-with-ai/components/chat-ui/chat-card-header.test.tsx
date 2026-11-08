/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Copy, Download, Share } from 'lucide-react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ChatCard,
  ChatCardFoldContent,
  ChatCardHeader,
  ChatCardHeaderAction,
  ChatCardHeaderActions,
} from '@/app/routes/chat-with-ai/components/chat-ui/chat-card';

vi.mock('i18next', () => ({ t: (key: string) => key }));

afterEach(() => {
  cleanup();
});

describe('ChatCardHeaderActions', () => {
  it('folds more than two actions into a menu when narrow', () => {
    render(<ChatCardHeaderActions actions={makeActions(3)} />);
    const inline = screen.getByRole('button', { name: 'Copy' }).parentElement;
    expect(inline?.className).toContain('@max-chat-narrow/chat:hidden');

    const more = screen.getByRole('button', { name: 'More actions' });
    const menuSlot = more.parentElement;
    expect(menuSlot?.className).toContain('hidden');
    expect(menuSlot?.className).toContain('@max-chat-narrow/chat:flex');
  });

  it('keeps two actions inline at every width', () => {
    render(<ChatCardHeaderActions actions={makeActions(2)} />);
    const inline = screen.getByRole('button', { name: 'Copy' }).parentElement;
    expect(inline?.className).not.toContain('@max-chat-narrow/chat:hidden');
    expect(screen.queryByRole('button', { name: 'More actions' })).toBe(null);
  });

  it('runs the action on click', () => {
    const actions = makeActions(2);
    render(<ChatCardHeaderActions actions={actions} />);
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(actions[1]?.onClick).toHaveBeenCalledTimes(1);
  });
});

describe('ChatCardHeader title', () => {
  it('clamps to two lines when asked', () => {
    render(
      <ChatCardHeader
        tile={<span />}
        title="Which project should I work in?"
        titleLines={2}
      />,
    );
    const title = screen.getByText('Which project should I work in?');
    expect(title.className).toContain('line-clamp-2');
    expect(title.className).not.toContain('truncate');
  });

  it('renders a leading control before the tile', () => {
    render(
      <ChatCardHeader
        tile={<span data-testid="tile" />}
        title="Pick a project"
        leading={<button>Back</button>}
      />,
    );
    const back = screen.getByRole('button', { name: 'Back' });
    const tile = screen.getByTestId('tile');
    expect(
      back.compareDocumentPosition(tile) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

describe('ChatCard fold', () => {
  it('does not fold a card that becomes foldable after mount', () => {
    const { rerender } = render(<Result foldable={false} />);
    expect(screen.getByText('Email: dana@northwind.io')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Show details' })).toBe(null);

    rerender(<Result foldable />);
    expect(screen.getByText('Email: dana@northwind.io')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Hide details' }));
    expect(screen.queryByText('Email: dana@northwind.io')).toBe(null);
  });

  it('starts folded when mounted foldable and keeps the summary visible', () => {
    render(<Result foldable />);
    expect(screen.queryByText('Email: dana@northwind.io')).toBe(null);
    expect(screen.getByText('Could not reach HubSpot')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Show details' }));
    expect(screen.getByText('Email: dana@northwind.io')).toBeTruthy();
  });
});

function Result({ foldable }: { foldable: boolean }) {
  return (
    <ChatCard foldable={foldable} defaultOpen={false}>
      <ChatCardHeader
        tile={<span />}
        title="Created contact Dana Park"
        meta="HubSpot · 2:32 PM"
        summary={<span>Could not reach HubSpot</span>}
      />
      <ChatCardFoldContent>
        <p>Email: dana@northwind.io</p>
      </ChatCardFoldContent>
    </ChatCard>
  );
}

function makeActions(count: number): ChatCardHeaderAction[] {
  const all: ChatCardHeaderAction[] = [
    { icon: Copy, label: 'Copy', onClick: vi.fn() },
    { icon: Download, label: 'Download', onClick: vi.fn() },
    { icon: Share, label: 'Share', onClick: vi.fn() },
  ];
  return all.slice(0, count);
}
