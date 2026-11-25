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
      'Analyze a multi-page or single-page PDF, TIFF, JPEG or PNG with AWS Textract and return its text, forms, tables, signatures and answers to optional questions, one queryResults row per question. Use it for multi-page documents, which the synchronous Analyze Document action cannot handle. Set source to "file" and pass the file, or to "s3" and pass the path of an object already in the bucket. With a file, the step uploads a temporary copy to the bucket under activepieces-textract-uploads/, analyzes it, then deletes the copy; if the delete fails, the copy stays and warnings names it. It waits up to 5 minutes for the job. Safe to retry. For an S3 file, the same deduplication token with the same inputs within 7 days returns the first job; the token cannot be combined with a file upload.',
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
  const upload = await uploadDocument({ s3, bucket, file });
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
}: {
  s3: S3Client;
  bucket: string;
  file: ApFile | ApStreamingFile;
}): Promise<UploadedDocument> {
  const extension = file.extension?.replace(/[^a-zA-Z0-9]/g, '');
  const key = `${UPLOAD_KEY_PREFIX}/${randomUUID()}${extension ? `.${extension}` : ''}`;
  const storage = await import('@aws-sdk/lib-storage');
  let upload: Upload | undefined;
  try {
    const { body } = streamUtils.toStreamingBody(file);
    upload = new storage.Upload({
      client: s3,
      params: { Bucket: bucket, Key: key, Body: body },
      leavePartsOnError: true,
    });
    const response = await upload.done();
    return { key, versionId: response.VersionId };
  } catch (e) {
    const message = uploadErrorMessage({ bucket, error: e });
    const abortWarning = await abortPartialUpload({ s3, bucket, key, uploadId: upload?.uploadId });
    throw new TextractStepError(abortWarning ? `${message} ${abortWarning}` : message);
  }
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
    return `Could not read the file to upload (${reason}). Check the File to Upload field and try again.`;
  }
  switch (error.name) {
    case 'AccessDenied':
      return `S3 refused the upload to bucket "${bucket}" (${reason}). The connection needs s3:PutObject, s3:GetObject and s3:DeleteObject on this bucket, plus s3:DeleteObjectVersion if it is versioned.`;
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
  const name = error instanceof Error ? error.name : '';
  return new TextractStepError(asyncErrorMessage(name) ?? formatTextractError(error));
}

function asyncErrorMessage(name: string): string | undefined {
  switch (name) {
    case 'UnsupportedDocumentException':
      return 'Textract cannot read this file type. Use a PDF, TIFF, JPEG or PNG file.';
    case 'DocumentTooLargeException':
      return 'The file is too large for Textract. PDF and TIFF files can be up to 500 MB, JPEG and PNG files up to 10 MB.';
    case 'IdempotentParameterMismatchException':
      return 'This Deduplication Token was used in the last 7 days with other inputs. Use a new token, or clear it.';
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

  const queryStrings = analysis.queries.filter(
    (q): q is string => typeof q === 'string' && q.trim().length > 0
  );
  if (queryStrings.length > 0) {
    resolvedFeatureTypes.push(FeatureType.QUERIES);
    startInput.QueriesConfig = {
      Queries: queryStrings.map((text) => ({ Text: text.trim(), Pages: ['*'] })),
    };
  }

  const startResponse = await client.send(new StartDocumentAnalysisCommand(startInput));

  const jobId = startResponse.JobId;
  if (!jobId) {
    throw new TextractStepError('Could not start the document analysis job. Please try again.');
  }

  const firstPage = await waitForJob({ client, jobId, deadline: analysis.startedAt + JOB_WAIT_MS });
  const pages = [firstPage];
  let nextToken = firstPage.NextToken;
  while (nextToken) {
    if (Date.now() >= analysis.startedAt + RESULTS_WAIT_MS) {
      throw new TextractStepError(
        'Textract finished, but reading all of its results took longer than 8 minutes. Try splitting the document into smaller parts and running this action on each part.'
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
    'Document analysis is taking longer than expected (5 minutes). This can happen with very large documents. Try splitting the document into smaller parts and running this action on each part.'
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

function oneResultPerQuestion(results: QueryResult[]): QueryResult[] {
  const byQuestion = new Map<string, QueryResult>();
  for (const result of results) {
    const kept = byQuestion.get(result.query);
    if (!kept || (!kept.answer && result.answer)) {
      byQuestion.set(result.query, result);
    }
  }
  return [...byQuestion.values()];
}

class TextractStepError extends Error {}

const POLL_INTERVAL_MS = 5000;
const JOB_WAIT_MS = 5 * 60 * 1000;
const RESULTS_WAIT_MS = 8 * 60 * 1000;
const UPLOAD_KEY_PREFIX = 'activepieces-textract-uploads';
const BUCKET_NAME_REGEX = /^[a-zA-Z0-9._-]{3,255}$/;

type AnalysisOptions = {
  featureTypes: FeatureType[];
  queries: unknown[];
  clientRequestToken: string | undefined;
  startedAt: number;
};

type UploadedDocument = {
  key: string;
  versionId: string | undefined;
};
