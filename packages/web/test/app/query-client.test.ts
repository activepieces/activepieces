/**
 * @vitest-environment jsdom
 */
import { AxiosError, AxiosResponse } from 'axios';
import { expect, it, vi } from 'vitest';

const toastError = vi.hoisted(() => vi.fn());
vi.mock('i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('i18next')>()),
  t: (key: string) => key,
}));

vi.mock('sonner', async (importOriginal) => ({
  ...(await importOriginal<typeof import('sonner')>()),
  toast: { error: toastError },
}));

import { queryClient } from '@/app/query-client';

it('toasts the reason of a failed mutation under its title', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const forbidden = new AxiosError(
    'Request failed',
    undefined,
    undefined,
    undefined,
    {
      status: 403,
      data: {
        code: 'AUTHORIZATION',
        params: { message: 'not owned by current project' },
      },
    } as AxiosResponse,
  );
  await queryClient
    .getMutationCache()
    .build(queryClient, {
      mutationFn: () => Promise.reject(forbidden),
      meta: { errorTitle: 'Could not remove key' },
    })
    .execute(undefined)
    .catch(() => undefined);

  expect(toastError).toHaveBeenCalledTimes(1);
  expect(toastError).toHaveBeenCalledWith(
    'Could not remove key',
    expect.objectContaining({
      description: "You don't have permission to do this.",
    }),
  );
});
