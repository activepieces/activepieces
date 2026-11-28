import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { s3Send, textractSend, s3ClientConstructor, uploadDone, uploadClients, uploadOptions, uploadIds } = vi.hoisted(() => {
  return {
    s3Send: vi.fn<(command: AwsCommand) => Promise<unknown>>(),
    textractSend: vi.fn<(command: AwsCommand) => Promise<unknown>>(),
    s3ClientConstructor: vi.fn(),
    uploadDone: vi.fn<(params: UploadParams) => Promise<unknown>>(),
    uploadClients: new Array<unknown>(),
    uploadOptions: new Array<Record<string, unknown>>(),
    uploadIds: new Array<string>(),
  };
});

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(function (config: unknown) {
    s3ClientConstructor(config);
    return { send: s3Send };
  }),
  DeleteObjectCommand: vi.fn(function (input: unknown) {
    return { kind: 'delete', input };
  }),
  AbortMultipartUploadCommand: vi.fn(function (input: unknown) {
    return { kind: 'abort', input };
  }),
}));

vi.mock('@aws-sdk/lib-storage', () => ({
  Upload: vi.fn(function ({ client, params, ...options }: { client: unknown; params: UploadParams }) {
    uploadClients.push(client);
    uploadOptions.push(options);
    return {
      done: () => uploadDone(params),
      get uploadId() {
        return uploadIds.at(0);
      },
    };
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
    uploadOptions.length = 0;
    uploadIds.length = 0;
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
      await runAction({
        source: 'file',
        file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf'),
        auth: { accessKeyId: ' AKIATEST\n', secretAccessKey: '\ttest-secret ', region: 'eu-north-1' },
      });

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

      uploadDone.mockImplementationOnce(async (params) => {
        expect(file.body.readableDidRead).toBe(false);
        uploadedBodies.push(await readAll(params.Body));
        return {};
      });

      await runAction({ source: 'file', file });

      expect(uploadParams().Body).toBeInstanceOf(Readable);
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
      s3Send.mockRejectedValueOnce(awsError({ name: 'AccessDenied', message: 'Access Denied' }));

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
      uploadDone.mockRejectedValueOnce(awsError({ name: 'AccessDenied', message: 'Access Denied' }));

      await expect(
        runAction({ source: 'file', file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf') })
      ).rejects.toThrow(
        'S3 refused the upload to bucket "docs-bucket" (AccessDenied: Access Denied). The connection needs s3:PutObject, s3:GetObject, s3:DeleteObject and s3:AbortMultipartUpload on this bucket, plus s3:DeleteObjectVersion if it is versioned.'
      );
      expect(textractSend).not.toHaveBeenCalled();
      expect(s3Send).not.toHaveBeenCalled();
    });

    it('keeps the cause of a failed multipart upload and removes the parts already sent', async () => {
      uploadIds.push('upload-1');
      uploadDone.mockRejectedValueOnce(Object.assign(new Error('terminated'), { name: 'TypeError' }));

      await expect(
        runAction({ source: 'file', file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf') })
      ).rejects.toThrow(
        /^Could not upload the file to S3 bucket "docs-bucket" \(TypeError: terminated\)\. Check the File to Upload field and the S3 Bucket name\.$/
      );
      expect(uploadOptions).toEqual([{ partSize: 5 * 1024 * 1024, leavePartsOnError: true }]);
      expect(abortInputs()).toEqual([{ Bucket: BUCKET, Key: expect.stringMatching(UPLOAD_KEY), UploadId: 'upload-1' }]);
      expect(textractSend).not.toHaveBeenCalled();
    });

    it('keeps the cause and says so when the parts already sent cannot be removed', async () => {
      uploadIds.push('upload-1');
      uploadDone.mockRejectedValueOnce(Object.assign(new Error('terminated'), { name: 'TypeError' }));
      s3Send.mockRejectedValueOnce(awsError({ name: 'AccessDenied', message: 'Access Denied' }));

      const error = await runAction({
        source: 'file',
        file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf'),
      }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(Error);
      const message = error instanceof Error ? error.message : '';
      expect(message).toMatch(/^Could not upload the file to S3 bucket "docs-bucket" \(TypeError: terminated\)\. /);
      expect(message).toMatch(
        /The parts already sent could not be removed from s3:\/\/docs-bucket\/activepieces-textract-uploads\/[0-9a-f-]{36}\.pdf \(AccessDenied: Access Denied\)\. Give the connection s3:AbortMultipartUpload on this bucket, or add a lifecycle rule that aborts incomplete multipart uploads\.$/
      );
    });

    it.each([
      [
        awsError({ name: 'NoSuchBucket', message: 'The specified bucket does not exist' }),
        'The S3 bucket "docs-bucket" does not exist (NoSuchBucket: The specified bucket does not exist). Check the S3 Bucket field.',
      ],
      [
        awsError({ name: 'PermanentRedirect', message: 'The bucket you are attempting to access must be addressed using the specified endpoint.' }),
        'The S3 bucket "docs-bucket" is in another AWS region (PermanentRedirect: The bucket you are attempting to access must be addressed using the specified endpoint.). Use a bucket in the connection\'s region.',
      ],
      [
        awsError({ name: 'AuthorizationHeaderMalformed', message: "the region 'us-east-1' is wrong; expecting 'eu-north-1'" }),
        'The S3 bucket "docs-bucket" is in another AWS region (AuthorizationHeaderMalformed: the region \'us-east-1\' is wrong; expecting \'eu-north-1\'). Use a bucket in the connection\'s region.',
      ],
      [
        awsError({ name: 'SlowDown', message: 'Please reduce your request rate.' }),
        'Could not upload the file to S3 bucket "docs-bucket" (SlowDown: Please reduce your request rate.).',
      ],
      [
        Object.assign(new Error('terminated'), { name: 'TypeError' }),
        'Could not upload the file to S3 bucket "docs-bucket" (TypeError: terminated). Check the File to Upload field and the S3 Bucket name.',
      ],
      [
        Object.assign(new Error('Unrecognized S3Express bucket name format.'), { name: 'EndpointError' }),
        'Could not upload the file to S3 bucket "docs-bucket" (EndpointError: Unrecognized S3Express bucket name format.). Check the File to Upload field and the S3 Bucket name.',
      ],
    ])('explains an upload failure by its cause: %s', async (error, message) => {
      uploadDone.mockRejectedValueOnce(error);

      await expect(
        runAction({ source: 'file', file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf') })
      ).rejects.toThrow(message);
      expect(textractSend).not.toHaveBeenCalled();
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

    it('names s3:GetObject and still deletes when Textract cannot read the uploaded copy', async () => {
      textractSend.mockRejectedValueOnce(
        awsError({ name: 'InvalidS3ObjectException', message: 'Unable to get object metadata from S3' })
      );

      await expect(
        runAction({ source: 'file', file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf') })
      ).rejects.toThrow(
        /^Textract could not read the uploaded copy from the bucket \(InvalidS3ObjectException: Unable to get object metadata from S3\)\. The connection needs s3:GetObject on this bucket\.$/
      );
      expect(deleteInputs()).toHaveLength(1);
    });

    it.each([
      [
        'UnsupportedDocumentException',
        'Textract cannot read this file type (UnsupportedDocumentException: rejected). Use a PDF, TIFF, JPEG or PNG file.',
      ],
      [
        'DocumentTooLargeException',
        'The file is too large for Textract (DocumentTooLargeException: rejected). PDF and TIFF files can be up to 500 MB, JPEG and PNG files up to 10 MB.',
      ],
    ])('explains %s for the uploaded file and still deletes it', async (name, message) => {
      textractSend.mockRejectedValueOnce(awsError({ name, message: 'rejected' }));

      await expect(
        runAction({ source: 'file', file: new ApFile('notes.docx', Buffer.from('PK'), 'docx') })
      ).rejects.toThrow(message);
      expect(deleteInputs()).toHaveLength(1);
    });

    it('reports a failed delete together with the analysis error', async () => {
      textractSend.mockImplementation(async (command: AwsCommand) =>
        command.kind === 'start' ? { JobId: 'job-1' } : { JobStatus: 'FAILED', StatusMessage: 'Unsupported document' }
      );
      s3Send.mockRejectedValueOnce(awsError({ name: 'AccessDenied', message: 'Access Denied' }));

      const error = await runAction({
        source: 'file',
        file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf'),
      }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(Error);
      expect(error instanceof Error ? error.message : error).toMatch(
        /^Document analysis failed: Unsupported document The uploaded file could not be deleted from s3:\/\/docs-bucket\/activepieces-textract-uploads\/[0-9a-f-]{36}\.pdf \(AccessDenied: Access Denied\)\. Delete it yourself, or give the connection s3:DeleteObject on this bucket\.$/
      );
    });

    it('returns the results with a warning when the uploaded file cannot be deleted', async () => {
      s3Send.mockRejectedValueOnce(awsError({ name: 'AccessDenied', message: 'Access Denied' }));

      const result = await runAction({ source: 'file', file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf') });

      expect(result).toMatchObject({
        pageCount: 3,
        warnings: expect.stringMatching(
          /^The uploaded file could not be deleted from s3:\/\/docs-bucket\/activepieces-textract-uploads\/[0-9a-f-]{36}\.pdf \(AccessDenied: Access Denied\)\. Delete it yourself, or give the connection s3:DeleteObject on this bucket\.$/
        ),
      });
    });

    it('keeps the page warning and the cleanup warning apart', async () => {
      textractSend.mockImplementation(async (command: AwsCommand) =>
        command.kind === 'start'
          ? { JobId: 'job-1' }
          : { ...threePageResult(), JobStatus: 'PARTIAL_SUCCESS', Warnings: [{ ErrorCode: 'UNSUPPORTED_PAGE', Pages: [2] }] }
      );
      s3Send.mockRejectedValueOnce(awsError({ name: 'AccessDenied', message: 'Access Denied' }));

      const result = await runAction({ source: 'file', file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf') });

      expect(result).toMatchObject({
        status: 'PARTIAL_SUCCESS',
        warnings: expect.stringMatching(
          /^Some pages could not be fully processed: UNSUPPORTED_PAGE on page\(s\): 2\. The uploaded file could not be deleted from s3:\/\/docs-bucket\//
        ),
      });
    });

    it('gives the job its full 5 minutes after a short upload, and still deletes the upload', async () => {
      uploadDone.mockImplementation(async () => {
        vi.setSystemTime(Date.now() + 60_000);
        return {};
      });
      textractSend.mockImplementation(async (command: AwsCommand) =>
        command.kind === 'start' ? { JobId: 'job-1' } : { JobStatus: 'IN_PROGRESS' }
      );

      await expect(
        runAction({ source: 'file', file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf') })
      ).rejects.toThrow(
        'Textract job job-1 did not finish in time. The step waits up to 5 minutes for the job, less after a slow upload.'
      );
      expect(getCalls()).toHaveLength(60);
      expect(deleteInputs()).toHaveLength(1);
    });

    it('waits for the job after a slow upload until 7 minutes into the step', async () => {
      uploadDone.mockImplementation(async () => {
        vi.setSystemTime(Date.now() + 290_000);
        return {};
      });
      textractSend.mockImplementation(async (command: AwsCommand) =>
        command.kind === 'start' ? { JobId: 'job-1' } : { JobStatus: 'IN_PROGRESS' }
      );

      await expect(
        runAction({ source: 'file', file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf') })
      ).rejects.toThrow('Textract job job-1 did not finish in time.');
      expect(getCalls()).toHaveLength(26);
      expect(deleteInputs()).toHaveLength(1);
    });

    it('returns the results of a job that finishes after a slow upload', async () => {
      uploadDone.mockImplementation(async () => {
        vi.setSystemTime(Date.now() + 290_000);
        return {};
      });
      let polls = 0;
      textractSend.mockImplementation(async (command: AwsCommand) => {
        if (command.kind === 'start') {
          return { JobId: 'job-1' };
        }
        polls += 1;
        return polls < 6 ? { JobStatus: 'IN_PROGRESS' } : threePageResult();
      });

      const result = await runAction({ source: 'file', file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf') });

      expect(result).toMatchObject({ status: 'SUCCEEDED', pageCount: 3 });
      expect(deleteInputs()).toHaveLength(1);
    });

    it('starts no job when the upload leaves under a minute of the 7, and still deletes the upload', async () => {
      uploadDone.mockImplementation(async () => {
        vi.setSystemTime(Date.now() + 365_000);
        return {};
      });

      await expect(
        runAction({ source: 'file', file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf') })
      ).rejects.toThrow('Uploading the file took over 6 minutes, so this step has too little time left to wait for the analysis.');
      expect(abortInputs()).toEqual([]);
      expect(textractSend).not.toHaveBeenCalled();
      expect(deleteInputs()).toHaveLength(1);
    });

    it('stops a multipart upload still running after 6 minutes and removes the parts already sent', async () => {
      uploadIds.push('upload-1');
      let megabytesRead = 0;
      uploadDone.mockImplementation(async (params) => {
        for await (const chunk of params.Body) {
          expect(chunk).toHaveLength(1024 * 1024);
          vi.setSystemTime(Date.now() + 100_000);
          megabytesRead += 1;
        }
        return {};
      });

      await expect(
        runAction({ source: 'file', file: new ApFile('contract.pdf', Buffer.alloc(30 * 1024 * 1024), 'pdf') })
      ).rejects.toThrow(
        /^Uploading the file took over 6 minutes, so this step has too little time left to wait for the analysis\. Upload it to S3 first and set Document Source to "File already in S3", or use a smaller file\.$/
      );
      expect(megabytesRead).toBe(5);
      expect(abortInputs()).toEqual([{ Bucket: BUCKET, Key: expect.stringMatching(UPLOAD_KEY), UploadId: 'upload-1' }]);
      expect(textractSend).not.toHaveBeenCalled();
      expect(deleteInputs()).toHaveLength(0);
    });

    it('stops reading results at the 8-minute limit and still deletes the upload', async () => {
      textractSend.mockImplementation(async (command: AwsCommand) => {
        if (command.kind === 'start') {
          return { JobId: 'job-1' };
        }
        vi.setSystemTime(Date.now() + 60_000);
        return { ...threePageResult(), NextToken: 'more' };
      });

      await expect(
        runAction({ source: 'file', file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf') })
      ).rejects.toThrow('Textract finished job job-1, but this step reached its 8-minute limit while reading the results.');
      expect(getCalls().length).toBeLessThan(10);
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

    it('closes a streaming file it does not upload', async () => {
      const file: ApStreamingFile = {
        filename: 'other.pdf',
        extension: 'pdf',
        body: Readable.from([Buffer.from('%PDF')]),
      };

      await runAction({ source: 's3', s3Key: 'reports/contract.pdf', file });

      expectNoS3Calls();
      expect(file.body.destroyed).toBe(true);
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

    it('explains a Deduplication Token already used with other inputs', async () => {
      textractSend.mockRejectedValueOnce(
        awsError({ name: 'IdempotentParameterMismatchException', message: 'ClientRequestToken reused with different parameters' })
      );

      await expect(
        runAction({ source: 's3', s3Key: 'reports/contract.pdf', clientRequestToken: 'invoice-001' })
      ).rejects.toThrow(
        'This Deduplication Token was used in the last 7 days with other inputs (IdempotentParameterMismatchException: ClientRequestToken reused with different parameters). Use a new token, or clear it.'
      );
    });

    it('reads every result page of a job that finishes just before the 5-minute wait ends', async () => {
      const startedAt = Date.now();
      textractSend.mockImplementation(async (command: AwsCommand) => {
        if (command.kind === 'start') {
          return { JobId: 'job-1' };
        }
        if (Date.now() < startedAt + 290_000) {
          return { JobStatus: 'IN_PROGRESS' };
        }
        vi.setSystemTime(Date.now() + 20_000);
        return resultPage(command.input['NextToken']);
      });

      const result = await runAction({ source: 's3', s3Key: 'reports/contract.pdf' });

      expect(result).toMatchObject({ status: 'SUCCEEDED', lines: [{ pageNumber: 1 }, { pageNumber: 2 }, { pageNumber: 3 }] });
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

    it('uploads a file when Document Source arrives empty', async () => {
      await runAction({ source: '', file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf') });

      expect(uploadParams().Key).toMatch(UPLOAD_KEY);
    });

    it('names both fields when neither a file nor an S3 File Path arrived', async () => {
      await expect(runAction({})).rejects.toThrow(
        'No file was received and S3 File Path is empty. Give a file to upload, or the S3 File Path of a document in the bucket.'
      );
      expectNoAwsCalls();
    });
  });

  describe('S3 Bucket', () => {
    it.each(['', '   ', '.', '...', 'a', 'docs/bucket'])('rejects %j before calling AWS', async (s3Bucket) => {
      await expect(
        runAction({ source: 'file', s3Bucket, file: new ApFile('contract.pdf', Buffer.from('%PDF'), 'pdf') })
      ).rejects.toThrow('is not a valid S3 bucket name.');
      expectNoAwsCalls();
    });

    it('closes a streaming file when the bucket name is refused', async () => {
      const file: ApStreamingFile = {
        filename: 'contract.pdf',
        extension: 'pdf',
        body: Readable.from([Buffer.from('%PDF')]),
      };

      await expect(runAction({ source: 'file', s3Bucket: 'a', file })).rejects.toThrow('is not a valid S3 bucket name.');
      expect(file.body.destroyed).toBe(true);
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

  it('asks a repeated question once', async () => {
    await runAction({ source: 's3', s3Key: 'contract.pdf', queries: ['What is the total due?', ' What is the total due? '] });

    expect(startInput()).toMatchObject({
      QueriesConfig: { Queries: [{ Text: 'What is the total due?', Pages: ['*'] }] },
    });
  });

  it('returns one row per question with the first page\'s answer, and every page\'s answer', async () => {
    textractSend.mockImplementation(async (command: AwsCommand) =>
      command.kind === 'start' ? { JobId: 'job-1' } : answeredQuestions()
    );

    const result = await runAction({ source: 's3', s3Key: 'contract.pdf', queries: ['Total Due', 'Invoice Number', 'Due Date'] });

    expect(result).toMatchObject({
      queryResults: [
        { query: 'Total Due', answer: '$1,250.00', pageNumber: 3, answers: [{ answer: '$1,250.00', confidence: 90, pageNumber: 3 }] },
        {
          query: 'Invoice Number',
          answer: 'INV-7',
          confidence: 40,
          pageNumber: 1,
          answers: [
            { answer: 'INV-7', confidence: 40, pageNumber: 1 },
            { answer: 'INV-8', confidence: 95, pageNumber: 2 },
          ],
        },
        { query: 'Due Date', answer: '', pageNumber: 1, answers: [] },
      ],
    });
  });

  it('keeps the first page\'s answer when Textract lists a later page first', async () => {
    const response = answeredQuestions();
    response.Blocks.reverse();
    textractSend.mockImplementation(async (command: AwsCommand) => (command.kind === 'start' ? { JobId: 'job-1' } : response));

    const result = await runAction({ source: 's3', s3Key: 'contract.pdf', queries: ['Total Due', 'Invoice Number', 'Due Date'] });

    expect(result).toMatchObject({
      queryResults: expect.arrayContaining([
        expect.objectContaining({
          query: 'Invoice Number',
          answer: 'INV-7',
          pageNumber: 1,
          answers: [
            { answer: 'INV-7', confidence: 40, pageNumber: 1 },
            { answer: 'INV-8', confidence: 95, pageNumber: 2 },
          ],
        }),
      ]),
    });
  });

  it('explains LimitExceededException as too many running jobs', async () => {
    textractSend.mockRejectedValueOnce(awsError({ name: 'LimitExceededException', message: 'limit' }));

    await expect(runAction({ source: 's3', s3Key: 'contract.pdf' })).rejects.toThrow(
      'Too many Textract jobs are running in this AWS account.'
    );
  });
});

async function runAction({
  auth = { accessKeyId: 'AKIATEST', secretAccessKey: 'test-secret', region: 'us-east-1' },
  ...props
}: {
  s3Bucket?: string;
  source?: string;
  file?: ApFile | ApStreamingFile;
  s3Key?: string;
  queries?: unknown[];
  clientRequestToken?: string;
  auth?: { accessKeyId: string; secretAccessKey: string; region: string };
}) {
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
    auth: { type: AppConnectionType.CUSTOM_AUTH, props: auth },
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

function abortInputs(): Record<string, unknown>[] {
  return s3Send.mock.calls
    .map(([command]) => command)
    .filter((command) => command.kind === 'abort')
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

function getCalls(): AwsCommand[] {
  return textractSend.mock.calls.map(([command]) => command).filter((command) => command.kind === 'get');
}

function awsError({ name, message }: { name: string; message: string }): Error {
  return Object.assign(new Error(message), { name, $metadata: { httpStatusCode: 400 } });
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

function resultPage(nextToken: unknown) {
  const page = nextToken === 'page-3' ? 3 : nextToken === 'page-2' ? 2 : 1;
  return {
    JobStatus: 'SUCCEEDED',
    DocumentMetadata: { Pages: 3 },
    NextToken: page < 3 ? `page-${page + 1}` : undefined,
    Blocks: [
      { BlockType: 'PAGE', Id: `page-${page}`, Page: page },
      { BlockType: 'LINE', Id: `line-${page}`, Page: page, Text: `Page marker ${page}`, Confidence: 99 },
    ],
  };
}

function answeredQuestions() {
  const questions = ['Total Due', 'Invoice Number', 'Due Date'];
  const answers = new Map([
    ['Total Due@3', { text: '$1,250.00', confidence: 90 }],
    ['Invoice Number@1', { text: 'INV-7', confidence: 40 }],
    ['Invoice Number@2', { text: 'INV-8', confidence: 95 }],
  ]);
  const blocks = [1, 2, 3].flatMap((page) =>
    questions.flatMap((question, index): Record<string, unknown>[] => {
      const id = `query-${page}-${index}`;
      const answer = answers.get(`${question}@${page}`);
      const query = { BlockType: 'QUERY', Id: id, Page: page, Query: { Text: question } };
      if (answer === undefined) {
        return [query];
      }
      return [
        { ...query, Relationships: [{ Type: 'ANSWER', Ids: [`${id}-answer`] }] },
        { BlockType: 'QUERY_RESULT', Id: `${id}-answer`, Page: page, Text: answer.text, Confidence: answer.confidence },
      ];
    })
  );
  return { JobStatus: 'SUCCEEDED', DocumentMetadata: { Pages: 3 }, Blocks: blocks };
}

type AwsCommand = { kind: string; input: Record<string, unknown> };
type UploadParams = { Bucket: string; Key: string; Body: Readable };
