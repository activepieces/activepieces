/**
 * @vitest-environment jsdom
 */
import { AxiosError, AxiosHeaders } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  VALIDATION_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
  PLAN_LIMIT_EVENT,
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

const quotaError = () => {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, {
    status: 402,
    statusText: '',
    headers: {},
    config,
    data: { code: 'QUOTA_EXCEEDED', params: { metric: 'users' } },
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

function flushReports(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => flushReports());

describe('mutationFeedback.error', () => {
  it('shows the server message under the shared toast id', async () => {
    const error = serverError({ status: 409, message: 'Name is taken' });

    mutationFeedback.error({ error, title: "Couldn't save changes" });

    await flushReports();
    expect(toast.error).toHaveBeenCalledWith("Couldn't save changes", {
      description: 'Name is taken',
    });
  });

  it('keeps raw validation text out of the toast', async () => {
    const config = { headers: new AxiosHeaders() };
    const error = new AxiosError(
      'Request failed',
      'ERR_BAD_REQUEST',
      config,
      null,
      {
        status: 400,
        statusText: '',
        headers: {},
        config,
        data: {
          statusCode: 400,
          code: 'FST_ERR_VALIDATION',
          error: 'Bad Request',
          message: 'body/displayName must NOT have fewer than 1 characters',
        },
      },
    );

    mutationFeedback.error({ error, title: "Couldn't save changes" });

    await flushReports();
    expect(toast.error).toHaveBeenCalledWith("Couldn't save changes", {
      description: VALIDATION_ERROR_MESSAGE,
    });
  });

  it('keeps the generic message for a server error with a top-level message', async () => {
    const config = { headers: new AxiosHeaders() };
    const error = new AxiosError(
      'Request failed',
      'ERR_BAD_RESPONSE',
      config,
      null,
      {
        status: 500,
        statusText: '',
        headers: {},
        config,
        data: { statusCode: 500, message: 'relation "x" does not exist' },
      },
    );

    expect(mutationFeedback.message(error)).toBe(INTERNAL_ERROR_MESSAGE);
  });

  it('falls back to a generic title and message', async () => {
    mutationFeedback.error({ error: serverError({ status: 500 }) });

    await flushReports();
    expect(toast.error).toHaveBeenCalledWith('Something went wrong', {
      description: INTERNAL_ERROR_MESSAGE,
    });
  });

  it('says when the server could not be reached', async () => {
    mutationFeedback.error({ error: networkError() });

    await flushReports();
    expect(toast.error.mock.calls[0][1].description).toBe(
      NETWORK_ERROR_MESSAGE,
    );
  });

  it('keeps the text of a plain Error out of the toast', async () => {
    mutationFeedback.error({ error: new Error('Disk full') });

    await flushReports();
    expect(toast.error.mock.calls[0][1].description).toBe(
      INTERNAL_ERROR_MESSAGE,
    );
  });

  it('shows the message of an error meant for the admin', async () => {
    mutationFeedback.error({
      error: mutationFeedback.userError('Flow import returned no flow.'),
    });

    await flushReports();
    expect(toast.error.mock.calls[0][1].description).toBe(
      'Flow import returned no flow.',
    );
  });

  it('records the error so later layers can stay quiet', async () => {
    const shown = new Error('shown');
    const other = new Error('other');

    mutationFeedback.error({ error: shown });

    expect(mutationFeedback.wasShown(shown)).toBe(true);
    expect(mutationFeedback.wasShown(other)).toBe(false);
  });

  it('tolerates errors that are not objects', async () => {
    mutationFeedback.error({ error: 'boom' });

    expect(mutationFeedback.wasShown('boom')).toBe(false);
    await flushReports();
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
        description: 'Gone',
      }),
    );
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it('says the undo failed when it hits a plan limit', async () => {
    const failure = quotaError();
    const onPlanLimit = vi.fn();
    window.addEventListener(PLAN_LIMIT_EVENT, onPlanLimit);
    mutationFeedback.undo({
      message: 'Acme deactivated',
      onUndo: vi.fn().mockRejectedValue(failure),
    });

    toast.success.mock.calls[0][1].action.onClick();

    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Couldn't undo", {
        description: "You've reached your plan's limit.",
      }),
    );
    expect(onPlanLimit).toHaveBeenCalledTimes(1);
    window.removeEventListener(PLAN_LIMIT_EVENT, onPlanLimit);
  });

  it('still says the undo failed when a plan limit dialog already opened', async () => {
    const failure = quotaError();
    mutationFeedback.markShown(failure);
    const onPlanLimit = vi.fn();
    window.addEventListener(PLAN_LIMIT_EVENT, onPlanLimit);
    mutationFeedback.undo({
      message: 'Acme deactivated',
      onUndo: vi.fn().mockRejectedValue(failure),
    });

    toast.success.mock.calls[0][1].action.onClick();

    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Couldn't undo", {
        description: "You've reached your plan's limit.",
      }),
    );
    expect(onPlanLimit).not.toHaveBeenCalled();
    window.removeEventListener(PLAN_LIMIT_EVENT, onPlanLimit);
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

describe('mutationFeedback undo refusals and ids', () => {
  it('passes the item id so a newer change replaces the older Undo toast', () => {
    mutationFeedback.undo({
      id: 'user-1',
      message: 'Ann on',
      onUndo: vi.fn(),
    });

    expect(toast.success.mock.calls[0][1].id).toBe('user-1');
  });

  it('keeps Undo available when the undo is refused for now', async () => {
    const onUndo = vi
      .fn()
      .mockRejectedValueOnce(
        mutationFeedback.userError(
          'Wait for the current change to finish, then undo.',
        ),
      )
      .mockResolvedValueOnce(undefined);
    mutationFeedback.undo({ id: 'switch', message: 'Ann on', onUndo });

    toast.success.mock.calls[0][1].action.onClick();

    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Couldn't undo", {
        description: 'Wait for the current change to finish, then undo.',
      }),
    );
    expect(toast.success).toHaveBeenCalledTimes(2);
    expect(toast.success.mock.calls[1][0]).toBe('Ann on');
    expect(toast.success.mock.calls[1][1].id).toMatch(/^switch:retry-/);

    toast.success.mock.calls[1][1].action.onClick();

    await vi.waitFor(() =>
      expect(toast.success).toHaveBeenLastCalledWith('Undone'),
    );
    expect(onUndo).toHaveBeenCalledTimes(2);
  });
});

describe('mutationFeedback.message priority', () => {
  it('keeps the server message ahead of the generic copy for a known code', () => {
    const config = { headers: new AxiosHeaders() };
    const error = new AxiosError(
      'Request failed',
      'ERR_BAD_REQUEST',
      config,
      null,
      {
        status: 404,
        statusText: '',
        headers: {},
        config,
        data: {
          code: 'ENTITY_NOT_FOUND',
          params: { message: 'Project Role by name and platformId not found' },
        },
      },
    );

    expect(mutationFeedback.message(error)).toBe(
      'Project Role by name and platformId not found',
    );
  });
});

describe('mutationFeedback.parseBlobError', () => {
  it('reads a JSON error out of a blob response so its message shows', async () => {
    const body = JSON.stringify({
      params: { message: 'Report is not ready' },
    });
    class JsonBlob extends Blob {
      text(): Promise<string> {
        return Promise.resolve(body);
      }
    }
    const config = { headers: new AxiosHeaders() };
    const error = new AxiosError(
      'Request failed',
      'ERR_BAD_REQUEST',
      config,
      null,
      {
        status: 400,
        statusText: '',
        headers: {},
        config,
        data: new JsonBlob([body], { type: 'application/json' }),
      },
    );

    await mutationFeedback.parseBlobError(error);

    expect(mutationFeedback.message(error)).toBe('Report is not ready');
  });

  it('leaves a blob that is not JSON alone', async () => {
    class TextBlob extends Blob {
      text(): Promise<string> {
        return Promise.resolve('not json');
      }
    }
    const config = { headers: new AxiosHeaders() };
    const error = new AxiosError(
      'Request failed',
      'ERR_BAD_REQUEST',
      config,
      null,
      {
        status: 400,
        statusText: '',
        headers: {},
        config,
        data: new TextBlob(['not json']),
      },
    );

    await mutationFeedback.parseBlobError(error);

    expect(mutationFeedback.message(error)).toBe(INTERNAL_ERROR_MESSAGE);
  });
});
