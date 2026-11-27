import { ApFile, ApStreamingFile, Property, ServerContext, createAction } from '@activepieces/pieces-framework';
import { streamUtils } from '@activepieces/pieces-common';
import type { S3Client } from '@aws-sdk/client-s3';
import type { Upload } from '@aws-sdk/lib-storage';
import {
  StartDocumentAnalysisCommand,
  GetDocumentAnalysisCommand,
  GetDocumentAnalysisCommandOutput,
  FeatureType,
  JobStatus,
  TextractClient,
} from '@aws-sdk/client-textract';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { amazonTextractAuth, TextractAuth } from '../auth';
import {
  QueryResult,
  createS3Client,
  createTextractClient,
  parseAnalysisBlocks,
  formatTextractError,
} from '../common';

export const analyzeDocumentAsync = createAction({
  auth: amazonTextractAuth,
  name: 'analyze-document-async',
  classification: 'READ',
  displayName: 'Analyze Document from S3 (Multi-Page)',
  description:
    'Extract text, forms, tables and signatures from a multi-page PDF or TIFF, uploaded here or already in S3.',
  audience: 'both',
  aiMetadata: {
    description:
      'Analyze a multi-page or single-page PDF, TIFF, JPEG or PNG with AWS Textract and return its text, forms, tables, signatures and answers to optional questions: one queryResults row per question with the answer from the first page that has one, and the answer from every page, with its confidence, in its answers list. Use it for multi-page documents, which the synchronous Analyze Document action cannot handle. Set source to "file" and pass the file, or to "s3" and pass the path of an object already in the bucket. With a file, the step uploads a temporary copy to the bucket under activepieces-textract-uploads/, analyzes it, then deletes the copy; if the delete fails, the copy stays and warnings names it. It waits up to 5 minutes for the job. Safe to retry. For an S3 file, the same deduplication token with the same inputs within 7 days returns the first job; the token cannot be combined with a file upload.',
    idempotent: true,
  },
  props: {
    s3Bucket: Property.ShortText({
      displayName: 'S3 Bucket',
      description: 'A bucket in the same AWS region as your connection.',
      required: true,
    }),
    source: Property.StaticDropdown({
      displayName: 'Document Source',
      description: 'Upload a file, or use a file already in the bucket.',
      required: false,
      defaultValue: 'file',
      options: {
        options: [
          { label: 'Upload a file', value: 'file' },
          { label: 'File already in S3', value: 's3' },
        ],
      },
    }),
    file: Property.File({
      displayName: 'File to Upload',
      description: 'Used when the source is a file. Its S3 copy is deleted after use.',
      required: false,
      streaming: true,
    }),
    s3Key: Property.ShortText({
      displayName: 'S3 File Path',
      description: 'Used when the source is S3, e.g. "reports/contract.pdf".',
      required: false,
    }),
    featureTypes: Property.StaticMultiSelectDropdown({
      displayName: 'What to Extract',
      description: 'Choose what to extract. Tables: structured grid data. Forms: labelled fields and their values (e.g. "Name: John"). Signatures: signature locations. Layout: document structure like titles, headers, and sections.',
      required: true,
      options: {
        options: [
          { label: 'Tables', value: FeatureType.TABLES },
          { label: 'Forms (Key-Value Pairs)', value: FeatureType.FORMS },
          { label: 'Signatures', value: FeatureType.SIGNATURES },
          { label: 'Layout (Titles, Headers, Sections)', value: FeatureType.LAYOUT },
        ],
      },
      defaultValue: [FeatureType.TABLES, FeatureType.FORMS],
    }),
    queries: Property.Array({
      displayName: 'Questions to Ask (Optional)',
      description: 'Ask plain-English questions about the document and get direct answers (e.g. "What is the invoice total?" or "What is the patient name?").',
      required: false,
    }),
    clientRequestToken: Property.ShortText({
      displayName: 'Deduplication Token (Optional)',
      description: 'S3 files only. Same token and inputs within 7 days give the same job.',
      required: false,
    }),
  },
  async run(context) {
    const startedAt = Date.now();
    const { s3Bucket, source, s3Key, file, featureTypes, queries, clientRequestToken } = context.propsValue;
    const analysis: AnalysisOptions = {
      featureTypes: [...featureTypes],
      queries: queries ?? [],
      clientRequestToken: clientRequestToken || undefined,
      startedAt,
    };
    const documentSource = source || (file ? 'file' : 's3');

    try {
      const bucket = validateBucket(s3Bucket);
      if (documentSource === 'file') {
        if (!file) {
          throw new TextractStepError(
            'No file was received. Check the File to Upload field, or set Document Source to "File already in S3".'
          );
        }
        if (analysis.clientRequestToken) {
          throw new TextractStepError(
            'The Deduplication Token works only with a file already in S3. Clear it to upload a file.'
          );
        }
        return await analyzeUploadedFile({
          auth: context.auth.props,
          server: context.server,
          bucket,
          file,
          analysis,
        });
      }
      if (!s3Key) {
        throw new TextractStepError(
          source
            ? 'Enter the S3 File Path of a document in the bucket, or set Document Source to "Upload a file".'
            : 'No file was received and S3 File Path is empty. Give a file to upload, or the S3 File Path of a document in the bucket.'
        );
      }
      const client = await createTextractClient({ auth: context.auth.props, server: context.server });
      return await analyzeS3Document({ client, bucket, key: s3Key, analysis });
    } catch (e) {
      throw toStepError(e);
    } finally {
      releaseFile(file);
    }
  },
});

function releaseFile(file: ApFile | ApStreamingFile | undefined): void {
  if (file && 'body' in file) {
    file.body.destroy();
  }
}

function validateBucket(value: unknown): string {
  const bucket = typeof value === 'string' ? value.trim() : '';
  if (!BUCKET_NAME_REGEX.test(bucket) || !/[a-zA-Z0-9]/.test(bucket)) {
    throw new TextractStepError(
      `"${String(value ?? '')}" is not a valid S3 bucket name. Enter the name of a bucket in the connection's AWS region.`
    );
  }
  return bucket;
}

async function analyzeUploadedFile({
  auth,
  server,
  bucket,
  file,
  analysis,
}: {
  auth: TextractAuth;
  server: ServerContext;
  bucket: string;
  file: ApFile | ApStreamingFile;
  analysis: AnalysisOptions;
}) {
  const client = await createTextractClient({ auth, server });
  const s3 = await createS3Client({ auth, server });
  const upload = await uploadDocument({
    s3,
    bucket,
    file,
    deadline: analysis.startedAt + STEP_JOB_WAIT_MS - MIN_JOB_WAIT_MS,
    stopAt: analysis.startedAt + STEP_RESULTS_WAIT_MS,
  });
  try {
    const result = await analyzeS3Document({ client, bucket, key: upload.key, analysis });
    const cleanupWarning = await deleteUploadedDocument({ s3, bucket, upload });
    if (!cleanupWarning) {
      return result;
    }
    return {
      ...result,
      warnings: [result.warnings, cleanupWarning].filter(Boolean).join(' '),
    };
  } catch (e) {
    const error = isAwsError(e) && e.name === 'InvalidS3ObjectException'
      ? new TextractStepError(
          `Textract could not read the uploaded copy from the bucket (${describeAwsError(e)}). The connection needs s3:GetObject on this bucket.`
        )
      : toStepError(e);
    const cleanupWarning = await deleteUploadedDocument({ s3, bucket, upload });
    if (!cleanupWarning) {
      throw error;
    }
    throw new TextractStepError(`${error.message} ${cleanupWarning}`);
  }
}

async function uploadDocument({
  s3,
  bucket,
  file,
  deadline,
  stopAt,
}: {
  s3: S3Client;
  bucket: string;
  file: ApFile | ApStreamingFile;
  deadline: number;
  stopAt: number;
}): Promise<UploadedDocument> {
  const extension = file.extension?.replace(/[^a-zA-Z0-9]/g, '');
  const key = `${UPLOAD_KEY_PREFIX}/${randomUUID()}${extension ? `.${extension}` : ''}`;
  const storage = await import('@aws-sdk/lib-storage');
  let upload: Upload | undefined;
  const reading: FileReading = { tooSlow: false, done: false };
  const stopTimer = setTimeout(() => {
    if (!reading.done) {
      reading.tooSlow = true;
      void upload?.abort();
    }
  }, Math.max(0, stopAt - Date.now()));
  try {
    const { body } = streamUtils.toStreamingBody(file);
    upload = new storage.Upload({
      client: s3,
      params: {
        Bucket: bucket,
        Key: key,
        Body: Readable.from(readUntil({ body, deadline, reading }), { highWaterMark: 1 }),
      },
      partSize: UPLOAD_PART_SIZE,
      leavePartsOnError: true,
    });
    const response = await upload.done();
    return { key, versionId: response.VersionId };
  } catch (e) {
    const message = reading.tooSlow ? SLOW_UPLOAD_MESSAGE : uploadErrorMessage({ bucket, error: e });
    const abortWarning = await abortPartialUpload({ s3, bucket, key, uploadId: upload?.uploadId });
    throw new TextractStepError(abortWarning ? `${message} ${abortWarning}` : message);
  } finally {
    clearTimeout(stopTimer);
  }
}

async function* readUntil({
  body,
  deadline,
  reading,
}: {
  body: Readable;
  deadline: number;
  reading: FileReading;
}): AsyncGenerator<Buffer> {
  for await (const data of body) {
    const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data);
    for (let start = 0; start < chunk.length; start += UPLOAD_READ_SIZE) {
      if (Date.now() > deadline) {
        reading.tooSlow = true;
        throw new TextractStepError(SLOW_UPLOAD_MESSAGE);
      }
      yield chunk.subarray(start, start + UPLOAD_READ_SIZE);
    }
  }
  reading.done = true;
}

async function abortPartialUpload({
  s3,
  bucket,
  key,
  uploadId,
}: {
  s3: S3Client;
  bucket: string;
  key: string;
  uploadId: string | undefined;
}): Promise<string | undefined> {
  if (!uploadId) {
    return undefined;
  }
  const { AbortMultipartUploadCommand } = await import('@aws-sdk/client-s3');
  try {
    await s3.send(new AbortMultipartUploadCommand({ Bucket: bucket, Key: key, UploadId: uploadId }));
    return undefined;
  } catch (e) {
    return `The parts already sent could not be removed from s3://${bucket}/${key} (${describeAwsError(e)}). Give the connection s3:AbortMultipartUpload on this bucket, or add a lifecycle rule that aborts incomplete multipart uploads.`;
  }
}

function uploadErrorMessage({ bucket, error }: { bucket: string; error: unknown }): string {
  const reason = describeAwsError(error);
  if (!isAwsError(error)) {
    return `Could not upload the file to S3 bucket "${bucket}" (${reason}). Check the File to Upload field and the S3 Bucket name.`;
  }
  switch (error.name) {
    case 'AccessDenied':
      return `S3 refused the upload to bucket "${bucket}" (${reason}). The connection needs s3:PutObject, s3:GetObject, s3:DeleteObject and s3:AbortMultipartUpload on this bucket, plus s3:DeleteObjectVersion if it is versioned.`;
    case 'NoSuchBucket':
      return `The S3 bucket "${bucket}" does not exist (${reason}). Check the S3 Bucket field.`;
    case 'PermanentRedirect':
    case 'AuthorizationHeaderMalformed':
      return `The S3 bucket "${bucket}" is in another AWS region (${reason}). Use a bucket in the connection's region.`;
    default:
      return `Could not upload the file to S3 bucket "${bucket}" (${reason}).`;
  }
}

async function deleteUploadedDocument({
  s3,
  bucket,
  upload,
}: {
  s3: S3Client;
  bucket: string;
  upload: UploadedDocument;
}): Promise<string | undefined> {
  const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: upload.key, VersionId: upload.versionId }));
    return undefined;
  } catch (e) {
    const permission = upload.versionId ? 's3:DeleteObjectVersion' : 's3:DeleteObject';
    return `The uploaded file could not be deleted from s3://${bucket}/${upload.key} (${describeAwsError(e)}). Delete it yourself, or give the connection ${permission} on this bucket.`;
  }
}

function isAwsError(error: unknown): error is Error {
  return error instanceof Error && '$metadata' in error;
}

function describeAwsError(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }
  return error.name && error.name !== 'Error' ? `${error.name}: ${error.message}` : error.message;
}

function toStepError(error: unknown): TextractStepError {
  if (error instanceof TextractStepError) {
    return error;
  }
  return new TextractStepError(asyncErrorMessage(error) ?? formatTextractError(error));
}

function asyncErrorMessage(error: unknown): string | undefined {
  const name = error instanceof Error ? error.name : '';
  const reason = describeAwsError(error);
  switch (name) {
    case 'UnsupportedDocumentException':
      return `Textract cannot read this file type (${reason}). Use a PDF, TIFF, JPEG or PNG file.`;
    case 'DocumentTooLargeException':
      return `The file is too large for Textract (${reason}). PDF and TIFF files can be up to 500 MB, JPEG and PNG files up to 10 MB.`;
    case 'IdempotentParameterMismatchException':
      return `This Deduplication Token was used in the last 7 days with other inputs (${reason}). Use a new token, or clear it.`;
    default:
      return undefined;
  }
}

async function analyzeS3Document({
  client,
  bucket,
  key,
  analysis,
}: {
  client: TextractClient;
  bucket: string;
  key: string;
  analysis: AnalysisOptions;
}) {
  const resolvedFeatureTypes: FeatureType[] = [...analysis.featureTypes];
  const startInput: ConstructorParameters<typeof StartDocumentAnalysisCommand>[0] = {
    DocumentLocation: {
      S3Object: { Bucket: bucket, Name: key },
    },
    FeatureTypes: resolvedFeatureTypes,
    ClientRequestToken: analysis.clientRequestToken,
  };

  const queryStrings = [
    ...new Set(
      analysis.queries
        .filter((q): q is string => typeof q === 'string')
        .map((q) => q.trim())
        .filter((q) => q.length > 0)
    ),
  ];
  if (queryStrings.length > 0) {
    resolvedFeatureTypes.push(FeatureType.QUERIES);
    startInput.QueriesConfig = {
      Queries: queryStrings.map((text) => ({ Text: text, Pages: ['*'] })),
    };
  }

  const lastJobWait = analysis.startedAt + STEP_JOB_WAIT_MS;
  if (Date.now() + MIN_JOB_WAIT_MS > lastJobWait) {
    throw new TextractStepError(SLOW_UPLOAD_MESSAGE);
  }

  const startResponse = await client.send(new StartDocumentAnalysisCommand(startInput));

  const jobId = startResponse.JobId;
  if (!jobId) {
    throw new TextractStepError('Could not start the document analysis job. Please try again.');
  }

  const firstPage = await waitForJob({
    client,
    jobId,
    deadline: Math.min(Date.now() + JOB_WAIT_MS, lastJobWait),
  });
  const pages = [firstPage];
  let nextToken = firstPage.NextToken;
  while (nextToken) {
    if (Date.now() >= analysis.startedAt + STEP_RESULTS_WAIT_MS) {
      throw new TextractStepError(
        `Textract finished job ${jobId}, but this step reached its 8-minute limit while reading the results. Try splitting the document into smaller parts and running this action on each part.`
      );
    }
    const page = await getAnalysisPage({ client, jobId, nextToken });
    pages.push(page);
    nextToken = page.NextToken;
  }

  const pageWarnings = pages.flatMap((page) =>
    (page.Warnings ?? [])
      .filter((warning) => warning.ErrorCode)
      .map((warning) => `${warning.ErrorCode} on page(s): ${warning.Pages?.join(', ') ?? 'unknown'}`)
  );
  const result = parseAnalysisBlocks(pages.flatMap((page) => page.Blocks ?? []));
  return {
    ...result,
    queryResults: oneResultPerQuestion(result.queryResults),
    pageCount: firstPage.DocumentMetadata?.Pages || result.pageCount,
    status: firstPage.JobStatus === JobStatus.PARTIAL_SUCCESS ? 'PARTIAL_SUCCESS' : 'SUCCEEDED',
    warnings: pageWarnings.length > 0
      ? `Some pages could not be fully processed: ${pageWarnings.join('; ')}.`
      : undefined,
  };
}

async function waitForJob({
  client,
  jobId,
  deadline,
}: {
  client: TextractClient;
  jobId: string;
  deadline: number;
}): Promise<GetDocumentAnalysisCommandOutput> {
  do {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    const response = await getAnalysisPage({ client, jobId, nextToken: undefined });
    if (response.JobStatus === JobStatus.FAILED) {
      throw new TextractStepError(
        `Document analysis failed: ${response.StatusMessage ?? 'AWS could not process this document. Check that the file is a valid, non-password-protected PDF, TIFF, JPEG, or PNG.'}`
      );
    }
    if (response.JobStatus !== JobStatus.IN_PROGRESS) {
      return response;
    }
  } while (Date.now() < deadline);

  throw new TextractStepError(
    `Textract job ${jobId} did not finish in time. The step waits up to 5 minutes for the job, less after a slow upload. This can happen with very large documents. Try splitting the document into smaller parts and running this action on each part.`
  );
}

function getAnalysisPage({
  client,
  jobId,
  nextToken,
}: {
  client: TextractClient;
  jobId: string;
  nextToken: string | undefined;
}): Promise<GetDocumentAnalysisCommandOutput> {
  return client.send(new GetDocumentAnalysisCommand({ JobId: jobId, MaxResults: 1000, NextToken: nextToken }));
}

function oneResultPerQuestion(results: QueryResult[]): QuestionResult[] {
  const byQuestion = new Map<string, QuestionResult>();
  for (const result of results) {
    const kept = byQuestion.get(result.query);
    const answers = kept?.answers ?? [];
    if (result.answer) {
      answers.push({ answer: result.answer, confidence: result.confidence, pageNumber: result.pageNumber });
    }
    const first = kept && !isEarlierAnswer({ candidate: result, current: kept }) ? kept : result;
    byQuestion.set(result.query, { ...first, answers });
  }
  return [...byQuestion.values()].map((row) => ({
    ...row,
    answers: [...row.answers].sort((a, b) => a.pageNumber - b.pageNumber),
  }));
}

function isEarlierAnswer({ candidate, current }: { candidate: QueryResult; current: QueryResult }): boolean {
  return candidate.answer.length > 0 && (!current.answer || candidate.pageNumber < current.pageNumber);
}

class TextractStepError extends Error {}

const POLL_INTERVAL_MS = 5000;
const JOB_WAIT_MS = 5 * 60 * 1000;
const STEP_JOB_WAIT_MS = 7 * 60 * 1000;
const MIN_JOB_WAIT_MS = 60 * 1000;
const SLOW_UPLOAD_MESSAGE =
  'Uploading the file took over 6 minutes, so this step has too little time left to wait for the analysis. Upload it to S3 first and set Document Source to "File already in S3", or use a smaller file.';
const STEP_RESULTS_WAIT_MS = 8 * 60 * 1000;
const UPLOAD_KEY_PREFIX = 'activepieces-textract-uploads';
const UPLOAD_PART_SIZE = 5 * 1024 * 1024;
const UPLOAD_READ_SIZE = 1024 * 1024;
const BUCKET_NAME_REGEX = /^[a-zA-Z0-9._-]{3,255}$/;

type AnalysisOptions = {
  featureTypes: FeatureType[];
  queries: unknown[];
  clientRequestToken: string | undefined;
  startedAt: number;
};

type QuestionResult = QueryResult & {
  answers: PageAnswer[];
};

type PageAnswer = {
  answer: string;
  confidence: number;
  pageNumber: number;
};

type FileReading = { tooSlow: boolean; done: boolean };

type UploadedDocument = {
  key: string;
  versionId: string | undefined;
};
