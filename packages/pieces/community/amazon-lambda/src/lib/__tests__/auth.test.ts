import { beforeEach, describe, expect, it, vi } from 'vitest';

const { send } = vi.hoisted(() => ({
  send: vi.fn<(command: unknown) => Promise<unknown>>(),
}));

vi.mock('@aws-sdk/client-lambda', () => ({
  LambdaClient: vi.fn<(this: { send: typeof send }) => void>(function LambdaClient(this: { send: typeof send }) {
    this.send = send;
  }),
  ListFunctionsCommand: vi.fn<(this: { input: unknown }, input: unknown) => void>(
    function ListFunctionsCommand(this: { input: unknown }, input: unknown) {
      this.input = input;
    },
  ),
}));

const { awsLambdaAccessKeyAuth, awsLambdaOidcAuth } = await import('../auth');

const server = { apiUrl: 'http://localhost/api/', publicUrl: 'http://localhost' };

describe('awsLambdaAccessKeyAuth', () => {
  beforeEach(() => {
    send.mockReset();
  });

  describe('when the connection is saved', () => {
    it('given a missing key, should reject it without calling AWS', async () => {
      const result = await awsLambdaAccessKeyAuth.validate?.({
        auth: { accessKeyId: '  ', secretAccessKey: 'secret', region: 'us-east-1' },
        server,
      });

      expect(result).toEqual({ valid: false, error: 'Access Key ID and Secret Access Key are required.' });
      expect(send).not.toHaveBeenCalled();
    });

    it('given ListFunctions succeeds, should accept the connection', async () => {
      send.mockResolvedValue({ Functions: [] });

      const result = await awsLambdaAccessKeyAuth.validate?.({
        auth: { accessKeyId: 'AKIA', secretAccessKey: 'secret', region: 'us-east-1' },
        server,
      });

      expect(result).toEqual({ valid: true });
      expect(send).toHaveBeenCalledOnce();
    });

    it('given ListFunctions fails, should surface the AWS error name and message', async () => {
      send.mockRejectedValue(Object.assign(new Error('The security token included in the request is invalid.'), {
        name: 'UnrecognizedClientException',
      }));

      const result = await awsLambdaAccessKeyAuth.validate?.({
        auth: { accessKeyId: 'AKIA', secretAccessKey: 'secret', region: 'eu-west-1' },
        server,
      });

      expect(result).toEqual({
        valid: false,
        error: 'UnrecognizedClientException: The security token included in the request is invalid.',
      });
    });
  });
});

describe('awsLambdaOidcAuth', () => {
  beforeEach(() => {
    send.mockReset();
  });

  describe('when the connection is saved', () => {
    it('given a well-formed role ARN, should accept it without calling AWS', async () => {
      const result = await awsLambdaOidcAuth.validate?.({
        auth: { roleArn: 'arn:aws:iam::123456789012:role/lambda-runner', region: 'us-east-1' },
        server,
      });

      expect(result).toEqual({ valid: true });
      expect(send).not.toHaveBeenCalled();
    });

    it('given an ARN that is not an IAM role, should reject it', async () => {
      const result = await awsLambdaOidcAuth.validate?.({
        auth: { roleArn: 'arn:aws:lambda:us-east-1:123456789012:function:billing', region: 'us-east-1' },
        server,
      });

      expect(result).toEqual({
        valid: false,
        error: 'Invalid IAM Role ARN format. Expected: arn:aws:iam::123456789012:role/RoleName',
      });
      expect(send).not.toHaveBeenCalled();
    });
  });
});
