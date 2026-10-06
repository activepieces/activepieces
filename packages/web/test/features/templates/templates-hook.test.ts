/**
 * @vitest-environment jsdom
 */
import { Template, TemplateStatus } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));
const templatesApi = vi.hoisted(() => ({
  delete: vi.fn(),
  update: vi.fn(),
  list: vi.fn(),
  create: vi.fn(),
  getCategories: vi.fn(),
  getTemplate: vi.fn(),
}));

vi.mock('sonner', () => ({ toast }));
vi.mock('i18next', () => ({
  t: (key: string, params?: Record<string, unknown>) =>
    params ? `${key} ${JSON.stringify(params)}` : key,
}));
vi.mock('@/features/templates/api/templates-api', () => ({ templatesApi }));

import {
  templateKeys,
  templatesMutations,
} from '@/features/templates/hooks/templates-hook';

const template = (id: string, status = TemplateStatus.PUBLISHED) =>
  ({ id, name: `Template ${id}`, status, metadata: null } as Template);

const LIST_KEY = [...templateKeys.platformCustom, '', ''];

const wrap = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };

const newClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });

describe('templatesMutations.useBulkDeleteTemplates', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reports the templates that failed and still deletes the rest', async () => {
    templatesApi.delete.mockImplementation(async (id: string) => {
      if (id === 'b') {
        throw new Error('nope');
      }
    });
    const { result } = renderHook(
      () => templatesMutations.useBulkDeleteTemplates(),
      { wrapper: wrap(newClient()) },
    );
    await act(() => result.current.mutateAsync([template('a'), template('b')]));
    expect(templatesApi.delete).toHaveBeenCalledTimes(2);
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error.mock.calls[0][1].description).toBe('Template b');
  });

  it('fails as a whole when nothing could be deleted', async () => {
    templatesApi.delete.mockRejectedValue(new Error('nope'));
    const { result } = renderHook(
      () => templatesMutations.useBulkDeleteTemplates(),
      { wrapper: wrap(newClient()) },
    );
    await act(async () => {
      await expect(result.current.mutateAsync([template('a')])).rejects.toThrow(
        'nope',
      );
    });
    expect(toast.error).toHaveBeenCalledTimes(1);
  });
});

describe('templatesMutations.useSetTemplateStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('archives in the list at once and offers undo', async () => {
    templatesApi.update.mockImplementation(async () => template('a'));
    const queryClient = newClient();
    queryClient.setQueryData(LIST_KEY, {
      data: [template('a')],
      next: null,
      previous: null,
    });
    const { result } = renderHook(
      () => templatesMutations.useSetTemplateStatus(),
      { wrapper: wrap(queryClient) },
    );
    act(() => {
      result.current.mutate({
        template: template('a'),
        status: TemplateStatus.ARCHIVED,
        previousStatus: TemplateStatus.PUBLISHED,
      });
    });
    await waitFor(() =>
      expect(
        queryClient.getQueryData<{ data: Template[] }>(LIST_KEY)?.data[0]
          .status,
      ).toBe(TemplateStatus.ARCHIVED),
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    const [, options] = toast.success.mock.calls[0];
    act(() => {
      options.action.onClick();
    });
    await waitFor(() => expect(templatesApi.update).toHaveBeenCalledTimes(2));
    expect(templatesApi.update.mock.calls[1][1]).toMatchObject({
      status: TemplateStatus.PUBLISHED,
    });
  });
});
