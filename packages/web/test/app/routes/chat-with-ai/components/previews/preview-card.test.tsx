/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Code2, Copy, Download, ExternalLink } from 'lucide-react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  PreviewAction,
  PreviewCard,
} from '@/app/routes/chat-with-ai/components/previews/preview-card';

vi.mock('i18next', () => ({ t: (key: string) => key }));

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

afterEach(() => {
  cleanup();
});

describe('PreviewCard header actions', () => {
  it('keeps the fixed order open, copy, download, expand', () => {
    renderCard({ actions: [download, copy, open] });
    expect(labelsIn(screen.getByTestId('preview-actions'))).toEqual([
      'Open in new tab',
      'Copy',
      'Download',
      'Expand',
    ]);
  });

  it('folds more than two actions into a menu below 520px, by class only', () => {
    renderCard({ actions: [copy, download] });
    const wide = screen.getByTestId('preview-actions');
    const narrow = screen.getByTestId('preview-actions-narrow');
    expect(wide.className).toContain('@max-chat-narrow/chat:hidden');
    expect(narrow.className).toContain('hidden');
    expect(narrow.className).toContain('@max-chat-narrow/chat:flex');
    expect(labelsIn(narrow)).toEqual(['Download', 'More actions']);
  });

  it('shows every action inline when there are two or fewer', () => {
    renderCard({ actions: [copy, download], expandable: false });
    expect(screen.queryByTestId('preview-actions-narrow')).toBe(null);
    expect(screen.getByTestId('preview-actions').className).not.toContain(
      '@max-chat-narrow/chat:hidden',
    );
  });

  it('opens the expanded view with the same header and close where expand was', () => {
    renderCard({ actions: [copy] });
    fireEvent.click(screen.getAllByRole('button', { name: 'Expand' })[0]);
    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toContain('Revenue by region');
    expect(dialog.textContent).toContain('Expanded body');
    const dialogButtons = Array.from(dialog.querySelectorAll('button')).map(
      (button) => button.getAttribute('aria-label'),
    );
    expect(dialogButtons).toEqual(['Copy', 'Close']);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBe(null);
  });
});

function renderCard({
  actions,
  expandable = true,
}: {
  actions: PreviewAction[];
  expandable?: boolean;
}) {
  return render(
    <PreviewCard
      icon={Code2}
      label="Revenue by region"
      meta="4 rows · 3 columns"
      actions={actions}
      renderExpanded={expandable ? () => <p>Expanded body</p> : undefined}
    >
      <p>Body</p>
    </PreviewCard>,
  );
}

function labelsIn(element: HTMLElement): (string | null)[] {
  return Array.from(element.querySelectorAll('button, a')).map((node) =>
    node.getAttribute('aria-label'),
  );
}

const noop = () => undefined;

const copy: PreviewAction = {
  id: 'copy',
  icon: Copy,
  label: 'Copy',
  onClick: noop,
};
const download: PreviewAction = {
  id: 'download',
  icon: Download,
  label: 'Download',
  onClick: noop,
};
const open: PreviewAction = {
  id: 'open',
  icon: ExternalLink,
  label: 'Open in new tab',
  onClick: noop,
};
