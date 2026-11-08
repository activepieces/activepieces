/**
 * @vitest-environment jsdom
 */
import { FileProducedEvent } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ProducedFileCard } from '@/app/routes/chat-with-ai/components/produced-file-card';

vi.mock('i18next', () => ({
  t: (key: string, params?: Record<string, string | number>) =>
    key.replace(/\{(\w+)\}/g, (_, name: string) =>
      String(params?.[name] ?? ''),
    ),
}));

afterEach(() => {
  cleanup();
});

describe('ProducedFileCard for a file that cannot be previewed', () => {
  it('shows a readable type and size, never the raw MIME type', () => {
    renderCard(
      file({
        fileName: 'leads-archive.zip',
        mediaType: 'application/zip',
        byteSize: 482_304,
      }),
    );
    expect(screen.getByText('ZIP · 471 KB')).toBeTruthy();
    expect(document.body.textContent).not.toContain('application/zip');
    const download = screen.getByRole('link', { name: 'Download' });
    expect(download.getAttribute('href')).toBe('https://files.test/f1');
  });

  it('falls back to the media type label when the name has no extension', () => {
    renderCard(
      file({ fileName: 'report', mediaType: 'application/pdf', byteSize: 0 }),
    );
    expect(screen.getByText('PDF')).toBeTruthy();
  });
});

function renderCard(produced: FileProducedEvent) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <ProducedFileCard file={produced} />
    </QueryClientProvider>,
  );
}

function file({
  fileName,
  mediaType,
  byteSize,
}: {
  fileName: string;
  mediaType: string;
  byteSize: number;
}): FileProducedEvent {
  return {
    toolCallId: 'call-1',
    fileId: 'f1',
    fileName,
    mediaType,
    byteSize,
    url: 'https://files.test/f1',
    timestamp: '2026-11-08T10:00:00.000Z',
  };
}
