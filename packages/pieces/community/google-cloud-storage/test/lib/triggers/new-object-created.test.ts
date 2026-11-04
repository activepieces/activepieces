import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';

const { gcsCommon } = await import('../../../src/lib/common/client');
const { newObjectCreated } = await import('../../../src/lib/triggers/new-object-created');

const makePubSubRequest = vi.spyOn(gcsCommon, 'makePubSubRequest');
const makeGCSRequest = vi.spyOn(gcsCommon, 'makeGCSRequest');

const ctx = () =>
  ({
    auth: { type: AppConnectionType.OAUTH2, access_token: 'oauth-token' },
    server: { apiUrl: 'http://api.local/', publicUrl: 'http://public.local/', token: 'engine-token' },
    propsValue: { projectId: 'my-project', bucket: 'my-bucket' },
    webhookUrl: 'https://automations.example.com/api/v1/webhooks/flow-id',
    store: { put: vi.fn(), get: vi.fn() },
  }) as never;

function permissionDenied(): HttpError {
  return new HttpError(undefined, {
    status: 403,
    responseBody: {
      error: {
        code: 403,
        message: 'User not authorized to perform this action.',
        status: 'PERMISSION_DENIED',
        details: [
          {
            '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
            reason: 'IAM_PERMISSION_DENIED',
            metadata: { troubleshooter_url: 'https://console.cloud.google.com/iam-admin/troubleshooter/summary;errorId=Ci0wMWEx', permission: 'pubsub.topics.create' },
          },
        ],
      },
    },
  });
}

beforeEach(() => {
  makePubSubRequest.mockReset();
  makeGCSRequest.mockReset();
});

describe('newObjectCreated.onEnable', () => {
  it('should report the Google message and the missing permission instead of the serialized response', async () => {
    makePubSubRequest.mockRejectedValueOnce(permissionDenied()).mockResolvedValue({});

    const error = await newObjectCreated.onEnable(ctx()).catch((e: Error) => e);

    expect((error as Error).message).toBe(
      'Failed to setup Pub/Sub notifications: User not authorized to perform this action (missing permission: pubsub.topics.create).',
    );
    expect((error as Error).message).not.toContain('troubleshooter');
  });

  it('should keep the Google message alone when no permission is reported', async () => {
    makePubSubRequest.mockResolvedValue({});
    makeGCSRequest.mockRejectedValueOnce(
      new HttpError(undefined, { status: 403, responseBody: { error: { code: 403, message: 'The project to be billed is associated with a closed billing account.' } } }),
    );

    const error = await newObjectCreated.onEnable(ctx()).catch((e: Error) => e);

    expect((error as Error).message).toBe(
      'Failed to setup Pub/Sub notifications: The project to be billed is associated with a closed billing account.',
    );
  });

  it('should truncate unexpected non-JSON error bodies', async () => {
    makePubSubRequest
      .mockRejectedValueOnce(new HttpError(undefined, { status: 502, responseBody: `<html>${'x'.repeat(500)}</html>` }))
      .mockResolvedValue({});

    const error = await newObjectCreated.onEnable(ctx()).catch((e: Error) => e);

    expect((error as Error).message.length).toBeLessThanOrEqual('Failed to setup Pub/Sub notifications: '.length + 301);
  });
});
