import { PropertyType } from '@activepieces/pieces-framework';
import { PieceOptionRequest } from '@activepieces/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

const internalErrorToast = vi.fn();
vi.mock('@/components/ui/sonner', () => ({
  internalErrorToast: () => internalErrorToast(),
}));

const post = vi.fn();
vi.mock('@/lib/api', () => ({ api: { post: () => post() } }));

import { piecesApi } from '@/features/pieces/api/pieces-api';

const request = {} as PieceOptionRequest;

describe('piecesApi.options', () => {
  beforeEach(() => {
    post.mockReset();
    internalErrorToast.mockReset();
  });

  it('rejects for DYNAMIC so callers can restore the cleared value', async () => {
    const failure = new Error('boom');
    post.mockRejectedValue(failure);

    await expect(
      piecesApi.options(request, PropertyType.DYNAMIC),
    ).rejects.toBe(failure);
  });

  it('resolves a disabled dropdown state for DROPDOWN', async () => {
    post.mockRejectedValue(new Error('boom'));

    const result = await piecesApi.options(request, PropertyType.DROPDOWN);

    expect(result.type).toBe(PropertyType.DROPDOWN);
    expect(result.options.disabled).toBe(true);
    expect(internalErrorToast).toHaveBeenCalledTimes(1);
  });
});
