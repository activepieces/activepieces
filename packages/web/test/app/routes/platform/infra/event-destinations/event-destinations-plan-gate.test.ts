// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { eventDestinationsCollectionUtils } from '@/app/routes/platform/infra/event-destinations/lib/event-destinations-collection';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  API_BASE_URL: 'http://localhost',
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

describe('eventDestinationsCollectionUtils.useAll on a plan without event streaming', () => {
  it('reports no destinations and never asks the server for them', async () => {
    const { result } = renderHook(() =>
      eventDestinationsCollectionUtils.useAll(false),
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current).toEqual({
      data: [],
      isLoading: false,
      isError: false,
    });
    expect(api.get).not.toHaveBeenCalled();
  });
});
