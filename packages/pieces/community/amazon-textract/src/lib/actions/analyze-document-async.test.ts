import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { s3Send, textractSend, s3ClientConstructor } = vi.hoisted(() => ({
  s3Send: vi.fn<(command: AwsCommand) => Promise<unknown>>(),
  textractSend: vi.fn<(command: AwsCommand) => Promise<unknown>>(),
  s3ClientConstructor: vi.fn(),
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(function (config: unknown) {
    s3ClientConstructor(config);
    return { send: s3Send };
  }),
  PutObjectCommand: vi.fn(function (input: unknown) {
    return { kind: 'put', input };
  }),
  DeleteObjectCommand: vi.fn(function (input: unknown) {
    return { kind: 'delete', input };
  }),
}));

vi.mock('@aws-sdk/client-textract', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@aws-sdk/client-textract')>()),
  TextractClient: vi.fn(function () {
    return { send: textractSend };
  }),
  StartDocumentAnalysisCommand: vi.fn(function (input: unknown) {
    return { kind: 'start', input };
  }),
  GetDocumentAnalysisCommand: vi.fn(function (input: unknown) {
    return { kind: 'get', input };
  }),
}));

import { ApFile, AppConnectionType, createMockActionContext } from '@activepieces/pieces-framework';
import { analyzeDocumentAsync } from './analyze-document-async';

const BUCKET = 'docs-bucket';

describe('Analyze Document from S3 (Multi-Page)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    s3Send.mockReset();
    textractSend.mockReset();
    s3ClientConstructor.mockReset();
    s3Send.mockResolvedValue({});
    textractSend.mockImplementation(async (command: AwsCommand) =>
      command.kind === 'start' ? { JobId: 'job-1' } : threePageResult()
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uploads the file to the bucket, analyzes the uploaded copy, then deletes it', async () => {
    const pdf = Buffer.from('%PDF-1.7 three pages');

    const result = await runAction({
      file: new ApFile('contract.pdf', pdf, 'pdf'),
      s3Key: 'reports/an-older-file.pdf',
    });

    const [put, remove] = s3Send.mock.calls.map(([command]) => command);
    expect(put.kind).toBe('put');
    expect(put.input).toMatchObject({ Bucket: BUCKET, Body: pdf });
    expect(put.input['Key']).toMatch(/^activepieces-textract-uploads\/[0-9a-f-]{36}\.pdf$/);
    expect(startInput()).toMatchObject({ DocumentLocation: { S3Object: { Bucket: BUCKET, Name: put.input['Key'] } } });
    expect(remove).toEqual({ kind: 'delete', input: { Bucket: BUCKET, Key: put.input['Key'] } });
    expect(result).toMatchObject({
      pageCount: 3,
      status: 'SUCCEEDED',
      warnings: undefined,
      lines: [{ pageNumber: 1 }, { pageNumber: 2 }, { pageNumber: 3 }],
    });
  });

  it('analyzes a file already in S3 without uploading or deleting anything', async () => {
    const result = await runAction({ s3Key: 'reports/contract.pdf' });

    expect(s3Send).not.toHaveBeenCalled();
    expect(s3ClientConstructor).not.toHaveBeenCalled();
    expect(startInput()).toMatchObject({ DocumentLocation: { S3Object: { Bucket: BUCKET, Name: 'reports/contract.pdf' } } });
    expect(result).toMatchObject({ pageCount: 3 });
  });

  it('fails with a clear message, before calling AWS, when there is no file and no S3 path', async () => {
    await expect(runAction({})).rejects.toThrow(
      'Upload a file, or enter the S3 File Path of a document already in the bucket.'
    );
    expect(textractSend).not.toHaveBeenCalled();
    expect(s3Send).not.toHaveBeenCalled();
  });

  it('names the missing permission when S3 refuses the upload, and never starts a job', async () => {
    s3Send.mockRejectedValueOnce(Object.assign(new Error('Access Denied'), { name: 'AccessDenied' }));

    await expect(runAction({ file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf') })).rejects.toThrow(
      'Could not upload the file to S3 bucket "docs-bucket" (AccessDenied: Access Denied). The connection needs s3:PutObject on this bucket, and the bucket must be in the same AWS region as the connection.'
    );
    expect(textractSend).not.toHaveBeenCalled();
  });

  it('still deletes the uploaded file when the analysis fails', async () => {
    textractSend.mockImplementation(async (command: AwsCommand) =>
      command.kind === 'start' ? { JobId: 'job-1' } : { JobStatus: 'FAILED', StatusMessage: 'Unsupported document' }
    );

    await expect(runAction({ file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf') })).rejects.toThrow(
      'Document analysis failed: Unsupported document'
    );
    const kinds = s3Send.mock.calls.map(([command]) => command.kind);
    expect(kinds).toEqual(['put', 'delete']);
  });

  it('returns the results with a warning when the uploaded file cannot be deleted', async () => {
    s3Send
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(Object.assign(new Error('Access Denied'), { name: 'AccessDenied' }));

    const result = await runAction({ file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf') });

    expect(result).toMatchObject({
      pageCount: 3,
      warnings: expect.stringMatching(
        /^The uploaded file could not be deleted from s3:\/\/docs-bucket\/activepieces-textract-uploads\/[0-9a-f-]{36}\.pdf \(AccessDenied: Access Denied\)\. Delete it yourself, or give the connection s3:DeleteObject on this bucket\.$/
      ),
    });
  });

  it('uploads to the same path for the same deduplication token, so a retried step matches the original job', async () => {
    await runAction({
      file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf'),
      clientRequestToken: 'invoice-001',
    });

    const put = s3Send.mock.calls[0][0];
    expect(put.input['Key']).toBe('activepieces-textract-uploads/invoice-001.pdf');
    expect(startInput()).toMatchObject({
      ClientRequestToken: 'invoice-001',
      DocumentLocation: { S3Object: { Bucket: BUCKET, Name: 'activepieces-textract-uploads/invoice-001.pdf' } },
    });
  });
});

async function runAction(props: {
  file?: ApFile;
  s3Key?: string;
  clientRequestToken?: string;
}) {
  const run = analyzeDocumentAsync.run({
    ...createMockActionContext<typeof analyzeDocumentAsync.props>({
      propsValue: {
        s3Bucket: BUCKET,
        file: undefined,
        s3Key: undefined,
        featureTypes: ['TABLES', 'FORMS'],
        queries: [],
        clientRequestToken: undefined,
        ...props,
      },
    }),
    auth: {
      type: AppConnectionType.CUSTOM_AUTH,
      props: { accessKeyId: 'AKIATEST', secretAccessKey: 'test-secret', region: 'us-east-1' },
    },
  });
  const state: { outcome?: { value: unknown } | { error: unknown } } = {};
  run.then(
    (value) => {
      state.outcome = { value };
    },
    (error: unknown) => {
      state.outcome = { error };
    }
  );
  while (!state.outcome) {
    await new Promise((resolve) => setImmediate(resolve));
    await vi.advanceTimersByTimeAsync(1000);
  }
  if ('error' in state.outcome) {
    throw state.outcome.error;
  }
  return state.outcome.value;
}

function startInput(): Record<string, unknown> {
  const start = textractSend.mock.calls
    .map(([command]) => command)
    .find((command) => command.kind === 'start');
  if (!start) {
    throw new Error('StartDocumentAnalysis was never called');
  }
  return start.input;
}

function threePageResult() {
  const pages = [1, 2, 3];
  return {
    JobStatus: 'SUCCEEDED',
    DocumentMetadata: { Pages: 3 },
    Blocks: [
      ...pages.map((page) => ({ BlockType: 'PAGE', Id: `page-${page}`, Page: page })),
      ...pages.map((page) => ({
        BlockType: 'LINE',
        Id: `line-${page}`,
        Page: page,
        Text: `Page marker ${page}`,
        Confidence: 99,
        Relationships: [{ Type: 'CHILD', Ids: [`word-${page}`] }],
      })),
      ...pages.map((page) => ({ BlockType: 'WORD', Id: `word-${page}`, Page: page, Text: `Page marker ${page}` })),
    ],
  };
}

type AwsCommand = { kind: string; input: Record<string, unknown> };
