import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { s3Send, textractSend, s3ClientConstructor, uploadDone, uploadClients } = vi.hoisted(() => ({
  s3Send: vi.fn<(command: AwsCommand) => Promise<unknown>>(),
  textractSend: vi.fn<(command: AwsCommand) => Promise<unknown>>(),
  s3ClientConstructor: vi.fn(),
  uploadDone: vi.fn<(params: UploadParams) => Promise<unknown>>(),
  uploadClients: [] as unknown[],
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(function (config: unknown) {
    s3ClientConstructor(config);
    return { send: s3Send };
  }),
  DeleteObjectCommand: vi.fn(function (input: unknown) {
    return { kind: 'delete', input };
  }),
}));

vi.mock('@aws-sdk/lib-storage', () => ({
  Upload: vi.fn(function ({ client, params }: { client: unknown; params: UploadParams }) {
    uploadClients.push(client);
    return { done: () => uploadDone(params) };
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

import { ApFile, ApStreamingFile, AppConnectionType, createMockActionContext } from '@activepieces/pieces-framework';
import { analyzeDocumentAsync } from './analyze-document-async';

const BUCKET = 'docs-bucket';
const UPLOAD_KEY = /^activepieces-textract-uploads\/[0-9a-f-]{36}\.pdf$/;
const uploadedBodies: Buffer[] = [];

describe('Analyze Document from S3 (Multi-Page)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    s3Send.mockReset();
    textractSend.mockReset();
    s3ClientConstructor.mockReset();
    uploadDone.mockReset();
    uploadClients.length = 0;
    uploadedBodies.length = 0;
    s3Send.mockResolvedValue({});
    uploadDone.mockImplementation(async (params) => {
      uploadedBodies.push(await readAll(params.Body));
      return { ETag: '"etag"' };
    });
    textractSend.mockImplementation(async (command: AwsCommand) =>
      command.kind === 'start' ? { JobId: 'job-1' } : threePageResult()
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Document Source: Upload a file', () => {
    it('uploads the file, analyzes the uploaded copy, then deletes it', async () => {
      const pdf = Buffer.from('%PDF-1.7 three pages');

      const result = await runAction({ source: 'file', file: new ApFile('contract.pdf', pdf, 'pdf') });

      const upload = uploadParams();
      expect(upload).toMatchObject({ Bucket: BUCKET, Key: expect.stringMatching(UPLOAD_KEY) });
      expect(uploadedBodies).toEqual([pdf]);
      expect(uploadClients).toEqual([expect.objectContaining({ send: s3Send })]);
      expect(startInput()).toMatchObject({ DocumentLocation: { S3Object: { Bucket: BUCKET, Name: upload.Key } } });
      expect(deleteInputs()).toEqual([{ Bucket: BUCKET, Key: upload.Key, VersionId: undefined }]);
      expect(result).toMatchObject({
        pageCount: 3,
        status: 'SUCCEEDED',
        warnings: undefined,
        lines: [{ pageNumber: 1 }, { pageNumber: 2 }, { pageNumber: 3 }],
      });
    });

    it('creates the S3 client in the connection region with trimmed access keys', async () => {
      await runAction(
        { source: 'file', file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf') },
        { accessKeyId: ' AKIATEST\n', secretAccessKey: '\ttest-secret ', region: 'eu-north-1' }
      );

      expect(s3ClientConstructor).toHaveBeenCalledWith({
        credentials: { accessKeyId: 'AKIATEST', secretAccessKey: 'test-secret' },
        region: 'eu-north-1',
      });
    });

    it('streams a streaming file to S3 without reading it into memory first', async () => {
      const file: ApStreamingFile = {
        filename: 'contract.pdf',
        extension: 'pdf',
        body: Readable.from([Buffer.from('%PDF-1.7 '), Buffer.from('streamed')]),
      };

      await runAction({ source: 'file', file });

      expect(uploadParams().Body).toBe(file.body);
      expect(uploadedBodies).toEqual([Buffer.from('%PDF-1.7 streamed')]);
    });

    it('uses a new random key for every upload', async () => {
      await runAction({ source: 'file', file: new ApFile('a.pdf', Buffer.from('%PDF a'), 'pdf') });
      await runAction({ source: 'file', file: new ApFile('a.pdf', Buffer.from('%PDF b'), 'pdf') });

      const [first, second] = uploadDone.mock.calls.map(([params]) => params.Key);
      expect(first).toMatch(UPLOAD_KEY);
      expect(second).toMatch(UPLOAD_KEY);
      expect(first).not.toBe(second);
    });

    it('uploads a file with no extension under a key with no extension', async () => {
      await runAction({ source: 'file', file: new ApFile('scan', Buffer.from('%PDF'), undefined) });

      expect(uploadParams().Key).toMatch(/^activepieces-textract-uploads\/[0-9a-f-]{36}$/);
    });

    it('deletes the exact version it uploaded when the bucket is versioned', async () => {
      uploadDone.mockResolvedValue({ VersionId: 'version-7' });

      await runAction({ source: 'file', file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf') });

      expect(deleteInputs()).toEqual([{ Bucket: BUCKET, Key: uploadParams().Key, VersionId: 'version-7' }]);
    });

    it('names s3:DeleteObjectVersion when the version cannot be deleted', async () => {
      uploadDone.mockResolvedValue({ VersionId: 'version-7' });
      s3Send.mockRejectedValueOnce(Object.assign(new Error('Access Denied'), { name: 'AccessDenied' }));

      const result = await runAction({ source: 'file', file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf') });

      expect(result).toMatchObject({ warnings: expect.stringContaining('give the connection s3:DeleteObjectVersion') });
    });

    it('fails instead of using S3 File Path when no file arrived', async () => {
      await expect(runAction({ source: 'file', file: undefined, s3Key: 'reports/another.pdf' })).rejects.toThrow(
        'No file was received. Check the File to Upload field, or set Document Source to "File already in S3".'
      );
      expectNoAwsCalls();
    });

    it('refuses a Deduplication Token with an upload, before calling AWS', async () => {
      await expect(
        runAction({
          source: 'file',
          file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf'),
          clientRequestToken: 'invoice-001',
        })
      ).rejects.toThrow('The Deduplication Token works only with a file already in S3. Clear it to upload a file.');
      expectNoAwsCalls();
    });

    it('names the missing permission when S3 refuses the upload, and never starts a job', async () => {
      uploadDone.mockRejectedValueOnce(Object.assign(new Error('Access Denied'), { name: 'AccessDenied' }));

      await expect(
        runAction({ source: 'file', file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf') })
      ).rejects.toThrow(
        'Could not upload the file to S3 bucket "docs-bucket" (AccessDenied: Access Denied). The connection needs s3:PutObject on this bucket, and the bucket must be in the same AWS region as the connection.'
      );
      expect(textractSend).not.toHaveBeenCalled();
      expect(s3Send).not.toHaveBeenCalled();
    });

    it('still deletes the uploaded file when the analysis fails', async () => {
      textractSend.mockImplementation(async (command: AwsCommand) =>
        command.kind === 'start' ? { JobId: 'job-1' } : { JobStatus: 'FAILED', StatusMessage: 'Unsupported document' }
      );

      await expect(
        runAction({ source: 'file', file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf') })
      ).rejects.toThrow(/^Document analysis failed: Unsupported document$/);
      expect(deleteInputs()).toHaveLength(1);
    });

    it('keeps the friendly Textract message and still deletes when AWS rejects the job', async () => {
      textractSend.mockRejectedValueOnce(
        Object.assign(new Error('Unable to get object metadata from S3'), { name: 'InvalidS3ObjectException' })
      );

      await expect(
        runAction({ source: 'file', file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf') })
      ).rejects.toThrow(/^The specified S3 object could not be read\. Check the bucket name, key, and permissions\.$/);
      expect(deleteInputs()).toHaveLength(1);
    });

    it('reports a failed delete together with the analysis error', async () => {
      textractSend.mockImplementation(async (command: AwsCommand) =>
        command.kind === 'start' ? { JobId: 'job-1' } : { JobStatus: 'FAILED', StatusMessage: 'Unsupported document' }
      );
      s3Send.mockRejectedValueOnce(Object.assign(new Error('Access Denied'), { name: 'AccessDenied' }));

      const error = await runAction({
        source: 'file',
        file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf'),
      }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(
        /^Document analysis failed: Unsupported document The uploaded file could not be deleted from s3:\/\/docs-bucket\/activepieces-textract-uploads\/[0-9a-f-]{36}\.pdf \(AccessDenied: Access Denied\)\. Delete it yourself, or give the connection s3:DeleteObject on this bucket\.$/
      );
    });

    it('returns the results with a warning when the uploaded file cannot be deleted', async () => {
      s3Send.mockRejectedValueOnce(Object.assign(new Error('Access Denied'), { name: 'AccessDenied' }));

      const result = await runAction({ source: 'file', file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf') });

      expect(result).toMatchObject({
        pageCount: 3,
        warnings: expect.stringMatching(
          /^The uploaded file could not be deleted from s3:\/\/docs-bucket\/activepieces-textract-uploads\/[0-9a-f-]{36}\.pdf \(AccessDenied: Access Denied\)\. Delete it yourself, or give the connection s3:DeleteObject on this bucket\.$/
        ),
      });
    });

    it('stops paging at the 5-minute limit and still deletes the upload', async () => {
      textractSend.mockImplementation(async (command: AwsCommand) => {
        if (command.kind === 'start') {
          return { JobId: 'job-1' };
        }
        vi.setSystemTime(Date.now() + 60_000);
        return { ...threePageResult(), NextToken: 'more' };
      });

      await expect(
        runAction({ source: 'file', file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf') })
      ).rejects.toThrow('Document analysis is taking longer than expected (5 minutes).');
      expect(textractSend.mock.calls.length).toBeLessThan(10);
      expect(deleteInputs()).toHaveLength(1);
    });
  });

  describe('Document Source: File already in S3', () => {
    it('analyzes the S3 file without uploading or deleting anything', async () => {
      const result = await runAction({ source: 's3', s3Key: 'reports/contract.pdf' });

      expectNoS3Calls();
      expect(startInput()).toMatchObject({ DocumentLocation: { S3Object: { Bucket: BUCKET, Name: 'reports/contract.pdf' } } });
      expect(result).toMatchObject({ pageCount: 3 });
    });

    it('ignores a file left in File to Upload', async () => {
      await runAction({
        source: 's3',
        s3Key: 'reports/contract.pdf',
        file: new ApFile('other.pdf', Buffer.from('%PDF'), 'pdf'),
      });

      expectNoS3Calls();
      expect(startInput()).toMatchObject({ DocumentLocation: { S3Object: { Name: 'reports/contract.pdf' } } });
    });

    it('passes the Deduplication Token to Textract', async () => {
      await runAction({ source: 's3', s3Key: 'reports/contract.pdf', clientRequestToken: 'invoice-001' });

      expect(startInput()).toMatchObject({ ClientRequestToken: 'invoice-001' });
    });

    it('fails with a clear message when S3 File Path is empty', async () => {
      await expect(runAction({ source: 's3' })).rejects.toThrow(
        'Enter the S3 File Path of a document in the bucket, or set Document Source to "Upload a file".'
      );
      expectNoAwsCalls();
    });
  });

  describe('steps saved before Document Source existed', () => {
    it('analyzes S3 File Path as before', async () => {
      await runAction({ s3Key: 'reports/contract.pdf' });

      expectNoS3Calls();
      expect(startInput()).toMatchObject({ DocumentLocation: { S3Object: { Bucket: BUCKET, Name: 'reports/contract.pdf' } } });
    });

    it('uploads a file when one is given', async () => {
      await runAction({ file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf') });

      expect(uploadParams().Key).toMatch(UPLOAD_KEY);
    });
  });

  describe('S3 Bucket', () => {
    it.each(['', '   ', '.', '...', 'a', 'docs/bucket'])('rejects %j before calling AWS', async (s3Bucket) => {
      await expect(
        runAction({ source: 'file', s3Bucket, file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf') })
      ).rejects.toThrow('is not a valid S3 bucket name.');
      expectNoAwsCalls();
    });

    it('trims spaces around the bucket name', async () => {
      await runAction({ source: 'file', s3Bucket: '  docs-bucket \n', file: new ApFile('c.pdf', Buffer.from('%PDF'), 'pdf') });

      expect(uploadParams().Bucket).toBe(BUCKET);
      expect(startInput()).toMatchObject({ DocumentLocation: { S3Object: { Bucket: BUCKET } } });
    });

    it('accepts a legacy us-east-1 name with capitals and underscores', async () => {
      await runAction({ source: 's3', s3Bucket: 'Legacy_Docs_Bucket', s3Key: 'contract.pdf' });

      expect(startInput()).toMatchObject({ DocumentLocation: { S3Object: { Bucket: 'Legacy_Docs_Bucket' } } });
    });
  });

  it('asks every question on every page', async () => {
    await runAction({ source: 's3', s3Key: 'contract.pdf', queries: ['What is the total due?', '  ', 42] });

    expect(startInput()).toMatchObject({
      FeatureTypes: ['TABLES', 'FORMS', 'QUERIES'],
      QueriesConfig: { Queries: [{ Text: 'What is the total due?', Pages: ['*'] }] },
    });
  });

  it('explains LimitExceededException as too many running jobs', async () => {
    textractSend.mockRejectedValueOnce(Object.assign(new Error('limit'), { name: 'LimitExceededException' }));

    await expect(runAction({ source: 's3', s3Key: 'contract.pdf' })).rejects.toThrow(
      'Too many Textract jobs are running in this AWS account.'
    );
  });
});

async function runAction(
  props: {
    s3Bucket?: string;
    source?: string;
    file?: ApFile | ApStreamingFile;
    s3Key?: string;
    queries?: unknown[];
    clientRequestToken?: string;
  },
  authProps: { accessKeyId: string; secretAccessKey: string; region: string } = {
    accessKeyId: 'AKIATEST',
    secretAccessKey: 'test-secret',
    region: 'us-east-1',
  }
) {
  const run = analyzeDocumentAsync.run({
    ...createMockActionContext<typeof analyzeDocumentAsync.props>({
      propsValue: {
        s3Bucket: BUCKET,
        source: undefined,
        file: undefined,
        s3Key: undefined,
        featureTypes: ['TABLES', 'FORMS'],
        queries: [],
        clientRequestToken: undefined,
        ...props,
      },
    }),
    auth: { type: AppConnectionType.CUSTOM_AUTH, props: authProps },
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

async function readAll(body: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of body) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function uploadParams(): UploadParams {
  const call = uploadDone.mock.calls[0];
  if (!call) {
    throw new Error('Nothing was uploaded');
  }
  return call[0];
}

function deleteInputs(): Record<string, unknown>[] {
  return s3Send.mock.calls
    .map(([command]) => command)
    .filter((command) => command.kind === 'delete')
    .map((command) => command.input);
}

function expectNoS3Calls() {
  expect(uploadDone).not.toHaveBeenCalled();
  expect(s3Send).not.toHaveBeenCalled();
  expect(s3ClientConstructor).not.toHaveBeenCalled();
}

function expectNoAwsCalls() {
  expectNoS3Calls();
  expect(textractSend).not.toHaveBeenCalled();
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
type UploadParams = { Bucket: string; Key: string; Body: Readable };
