import { beforeEach, describe, expect, it, vi } from 'vitest';

const { bedrockClientMock, runtimeClientMock, sendMock } = vi.hoisted(() => ({
  bedrockClientMock: vi.fn(),
  runtimeClientMock: vi.fn(),
  sendMock: vi.fn(),
}));

vi.mock('@aws-sdk/client-bedrock', () => ({
  BedrockClient: bedrockClientMock.mockImplementation(() => ({ send: sendMock })),
  ListFoundationModelsCommand: vi.fn((input: unknown) => ({ input })),
  ListInferenceProfilesCommand: vi.fn((input: unknown) => ({ input })),
  ModelModality: { TEXT: 'TEXT', IMAGE: 'IMAGE' },
}));

vi.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: runtimeClientMock.mockImplementation(() => ({ send: sendMock })),
  AudioFormat: {},
  DocumentFormat: {},
  ImageFormat: {},
  VideoFormat: {},
}));

import { awsBedrockAuth } from './auth';
import { createBedrockRuntimeClient } from './common';

const accessKeyAuth = {
  accessKeyId: 'ASIAEXAMPLE',
  secretAccessKey: 'secret',
  region: 'us-east-1',
};

const server = { apiUrl: 'http://127.0.0.1:4200/api/', publicUrl: 'http://127.0.0.1:4200/api/', token: 'token' };

function credentialsOf(mock: typeof bedrockClientMock) {
  return mock.mock.calls[0][0].credentials;
}

describe('aws bedrock access key auth', () => {
  beforeEach(() => {
    bedrockClientMock.mockClear();
    runtimeClientMock.mockClear();
    sendMock.mockReset();
    sendMock.mockResolvedValue({ modelSummaries: [] });
  });

  it('signs validation with the session token, so temporary credentials are accepted', async () => {
    const result = await awsBedrockAuth.validate?.({
      auth: { ...accessKeyAuth, sessionToken: 'temporary' },
      server,
    });

    expect(result).toEqual({ valid: true });
    expect(credentialsOf(bedrockClientMock)).toEqual({
      accessKeyId: 'ASIAEXAMPLE',
      secretAccessKey: 'secret',
      sessionToken: 'temporary',
    });
  });

  it('leaves the session token unset for a long-term access key', async () => {
    await awsBedrockAuth.validate?.({ auth: accessKeyAuth, server });

    expect(credentialsOf(bedrockClientMock).sessionToken).toBeUndefined();
  });

  it('carries the session token into the runtime client that actions call', async () => {
    await createBedrockRuntimeClient({
      auth: { ...accessKeyAuth, sessionToken: 'temporary' },
      server,
    });

    expect(credentialsOf(runtimeClientMock)).toEqual({
      accessKeyId: 'ASIAEXAMPLE',
      secretAccessKey: 'secret',
      sessionToken: 'temporary',
    });
  });
});
