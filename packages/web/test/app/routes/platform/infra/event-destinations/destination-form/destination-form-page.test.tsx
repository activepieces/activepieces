// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import EventDestinationFormPage from '@/app/routes/platform/infra/event-destinations/destination-form';
import { DESTINATION_KIND_SEARCH_PARAM } from '@/app/routes/platform/infra/event-destinations/lib/destination-kinds';
import { EVENT_STREAMING_PATH } from '@/app/routes/platform/infra/event-destinations/lib/event-streaming-path';

const { saveDestination } = vi.hoisted(() => ({ saveDestination: vi.fn() }));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@/lib/api', () => ({
  API_BASE_URL: 'http://localhost',
  api: { isApError: () => false, serverErrorMessage: () => undefined },
}));

vi.mock(
  '@/app/routes/platform/infra/event-destinations/lib/event-destinations-collection',
  () => ({
    eventDestinationsCollectionUtils: {
      useSaveEventDestination: () => ({
        mutate: saveDestination,
        isPending: false,
      }),
    },
  }),
);

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('EventDestinationFormPage', () => {
  it('keeps the page when the browser submits the form on Enter in the event search', () => {
    const router = createMemoryRouter(
      [
        {
          path: `${EVENT_STREAMING_PATH}/new`,
          element: <EventDestinationFormPage />,
        },
      ],
      {
        initialEntries: [
          `${EVENT_STREAMING_PATH}/new?${DESTINATION_KIND_SEARCH_PARAM}=otel`,
        ],
      },
    );
    render(<RouterProvider router={router} />);

    const isNativeSubmitAllowed = fireEvent.submit(
      screen.getByPlaceholderText('Search events'),
    );

    expect(isNativeSubmitAllowed).toBe(false);
    expect(saveDestination).not.toHaveBeenCalled();
  });
});
