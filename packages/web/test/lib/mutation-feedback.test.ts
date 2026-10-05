/**
 * @vitest-environment jsdom
 */
import { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('sonner', () => ({ toast }));
vi.mock('i18next', () => ({
  t: (key: string) => key,
}));

import {
  INTERNAL_ERROR_MESSAGE,
  MUTATION_ERROR_TOAST_ID,
  NETWORK_ERROR_MESSAGE,
  UNDO_TOAST_DURATION_MS,
  mutationFeedback,
} from '@/lib/mutation-feedback';

const serverError = ({
  status,
  message,
}: {
  status: number;
  message?: string;
}) => {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, {
    status,
    statusText: '',
    headers: {},
    config,
    data: message === undefined ? {} : { params: { message } },
  });
};

const networkError = () =>
  new AxiosError('Network Error', 'ERR_NETWORK', {
    headers: new AxiosHeaders(),
  });

const clickUndo = async () => {
  const [, options] = toast.success.mock.calls[0];
  options.action.onClick();
  await vi.waitFor(() => expect(toast.success).toHaveBeenCalledTimes(2));
};

beforeEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
});

describe('mutationFeedback.error', () => {
  it('shows the server message under the shared toast id', () => {
    const error = serverError({ status: 409, message: 'Name is taken' });

    mutationFeedback.error({ error, title: "Couldn't save changes" });

    expect(toast.error).toHaveBeenCalledWith("Couldn't save changes", {
      id: MUTATION_ERROR_TOAST_ID,
      description: 'Name is taken',
    });
  });

  it('falls back to a generic title and message', () => {
    mutationFeedback.error({ error: serverError({ status: 500 }) });

    expect(toast.error).toHaveBeenCalledWith('Something went wrong', {
      id: MUTATION_ERROR_TOAST_ID,
      description: INTERNAL_ERROR_MESSAGE,
    });
  });

  it('says when the server could not be reached', () => {
    mutationFeedback.error({ error: networkError() });

    expect(toast.error.mock.calls[0][1].description).toBe(
      NETWORK_ERROR_MESSAGE,
    );
  });

  it('uses the message of a plain Error', () => {
    mutationFeedback.error({ error: new Error('Disk full') });

    expect(toast.error.mock.calls[0][1].description).toBe('Disk full');
  });

  it('records the error so later layers can stay quiet', () => {
    const shown = new Error('shown');
    const other = new Error('other');

    mutationFeedback.error({ error: shown });

    expect(mutationFeedback.wasShown(shown)).toBe(true);
    expect(mutationFeedback.wasShown(other)).toBe(false);
  });

  it('tolerates errors that are not objects', () => {
    mutationFeedback.error({ error: 'boom' });

    expect(mutationFeedback.wasShown('boom')).toBe(false);
    expect(toast.error).toHaveBeenCalledTimes(1);
  });
});

describe('mutationFeedback.markShown', () => {
  it('marks an error shown without a toast', () => {
    const error = new Error('inline');

    mutationFeedback.markShown(error);

    expect(mutationFeedback.wasShown(error)).toBe(true);
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe('mutationFeedback.isNetworkError', () => {
  it('is true only for a request with no response', () => {
    expect(mutationFeedback.isNetworkError(networkError())).toBe(true);
    expect(mutationFeedback.isNetworkError(serverError({ status: 400 }))).toBe(
      false,
    );
    expect(mutationFeedback.isNetworkError(new Error('x'))).toBe(false);
  });
});

describe('mutationFeedback.undo', () => {
  it('shows a success toast with an Undo action', () => {
    mutationFeedback.undo({ message: 'Acme deleted', onUndo: vi.fn() });

    expect(toast.success).toHaveBeenCalledWith('Acme deleted', {
      duration: UNDO_TOAST_DURATION_MS,
      action: { label: 'Undo', onClick: expect.any(Function) },
    });
  });

  it('runs onUndo and confirms', async () => {
    const onUndo = vi.fn().mockResolvedValue(undefined);
    mutationFeedback.undo({ message: 'Acme deleted', onUndo });

    await clickUndo();

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenLastCalledWith('Undone');
  });

  it('uses the custom undone message', async () => {
    mutationFeedback.undo({
      message: 'Acme deleted',
      onUndo: vi.fn(),
      undoneMessage: 'Acme restored',
    });

    await clickUndo();

    expect(toast.success).toHaveBeenLastCalledWith('Acme restored');
  });

  it('shows an error when undo fails', async () => {
    const failure = serverError({ status: 500, message: 'Gone' });
    mutationFeedback.undo({
      message: 'Acme deleted',
      onUndo: vi.fn().mockRejectedValue(failure),
    });

    toast.success.mock.calls[0][1].action.onClick();

    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Couldn't undo", {
        id: MUTATION_ERROR_TOAST_ID,
        description: 'Gone',
      }),
    );
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it('does not toast twice when the undo error was already shown', async () => {
    const failure = new Error('already shown');
    mutationFeedback.markShown(failure);
    mutationFeedback.undo({
      message: 'Acme deleted',
      onUndo: vi.fn().mockRejectedValue(failure),
    });

    toast.success.mock.calls[0][1].action.onClick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(toast.error).not.toHaveBeenCalled();
  });
});
