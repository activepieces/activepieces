import { ApFile, ApStreamingFile, Property, ServerContext, createAction } from '@activepieces/pieces-framework';
import { streamUtils } from '@activepieces/pieces-common';
import type { S3Client } from '@aws-sdk/client-s3';
import {
  StartDocumentAnalysisCommand,
  GetDocumentAnalysisCommand,
  GetDocumentAnalysisCommandOutput,
  FeatureType,
  JobStatus,
  Block,
  TextractClient,
} from '@aws-sdk/client-textract';
import { randomUUID } from 'node:crypto';
import { amazonTextractAuth, TextractAuth } from '../auth';
import { createS3Client, createTextractClient, parseAnalysisBlocks, formatTextractError } from '../common';

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
      'Analyze a multi-page or single-page PDF, TIFF, JPEG or PNG with AWS Textract and return its text, forms, tables, signatures, layout and answers to optional questions. Use it for multi-page documents, which the synchronous Analyze Document action cannot handle. Set source to "file" and pass the file, or to "s3" and pass the path of an object already in the bucket. With a file, the step uploads it to the bucket under activepieces-textract-uploads/, analyzes it, then deletes it. It waits up to 5 minutes for the job. Safe to retry: it changes nothing lasting. For an S3 file, reusing the same deduplication token within 7 days returns the first job; the token cannot be combined with a file upload.',
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
      description: 'Used when the source is a file. Deleted after the analysis.',
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
      description: 'S3 files only. Reused within 7 days, it returns the first job.',
      required: false,
    }),
  },
  async run(context) {
    const { s3Bucket, source, s3Key, file, featureTypes, queries, clientRequestToken } = context.propsValue;
    const bucket = validateBucket(s3Bucket);
    const analysis: AnalysisOptions = {
      featureTypes: [...featureTypes],
      queries: queries ?? [],
      clientRequestToken: clientRequestToken || undefined,
    };
    const documentSource = source ?? (file ? 'file' : 's3');

    try {
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
          'Enter the S3 File Path of a document in the bucket, or set Document Source to "Upload a file".'
        );
      }
      const client = await createTextractClient({ auth: context.auth.props, server: context.server });
      return await analyzeS3Document({ client, bucket, key: s3Key, analysis });
    } catch (e) {
      throw toStepError(e);
    }
  },
});

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
    const error = toStepError(e);
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
  const { Upload } = await import('@aws-sdk/lib-storage');
  try {
    const { body } = streamUtils.toStreamingBody(file);
    const response = await new Upload({
      client: s3,
      params: { Bucket: bucket, Key: key, Body: body },
    }).done();
    return { key, versionId: response.VersionId };
  } catch (e) {
    throw new TextractStepError(
      `Could not upload the file to S3 bucket "${bucket}" (${describeAwsError(e)}). The connection needs s3:PutObject on this bucket, and the bucket must be in the same AWS region as the connection.`
    );
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
  return new TextractStepError(formatTextractError(error));
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

  const timeoutAt = Date.now() + TIMEOUT_MS;

  do {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    const allBlocks: Block[] = [];
    const allWarnings: string[] = [];
    let totalPages = 0;
    let nextToken: string | undefined = undefined;

    do {
      const pollResponse: GetDocumentAnalysisCommandOutput = await client.send(
        new GetDocumentAnalysisCommand({
          JobId: jobId,
          MaxResults: 1000,
          NextToken: nextToken,
        })
      );

      const status = pollResponse.JobStatus;

      if (status === JobStatus.FAILED) {
        throw new TextractStepError(
          `Document analysis failed: ${pollResponse.StatusMessage ?? 'AWS could not process this document. Check that the file is a valid, non-password-protected PDF, TIFF, JPEG, or PNG.'}`
        );
      }

      if (status === JobStatus.IN_PROGRESS) {
        break;
      }

      if (totalPages === 0 && pollResponse.DocumentMetadata?.Pages) {
        totalPages = pollResponse.DocumentMetadata.Pages;
      }

      for (const warning of pollResponse.Warnings ?? []) {
        if (warning.ErrorCode) {
          const pages = warning.Pages?.join(', ') ?? 'unknown';
          allWarnings.push(`${warning.ErrorCode} on page(s): ${pages}`);
        }
      }

      allBlocks.push(...(pollResponse.Blocks ?? []));
      nextToken = pollResponse.NextToken;

      if (!nextToken) {
        const result = parseAnalysisBlocks(allBlocks);
        return {
          ...result,
          pageCount: totalPages || result.pageCount,
          status: status === JobStatus.PARTIAL_SUCCESS ? 'PARTIAL_SUCCESS' : 'SUCCEEDED',
          warnings: allWarnings.length > 0
            ? `Some pages could not be fully processed: ${allWarnings.join('; ')}`
            : undefined,
        };
      }
    } while (nextToken && Date.now() < timeoutAt);
  } while (Date.now() < timeoutAt);

  throw new TextractStepError(
    'Document analysis is taking longer than expected (5 minutes). This can happen with very large documents. Try splitting the document into smaller parts and running this action on each part.'
  );
}

class TextractStepError extends Error {}

const POLL_INTERVAL_MS = 5000;
const TIMEOUT_MS = 5 * 60 * 1000;
const UPLOAD_KEY_PREFIX = 'activepieces-textract-uploads';
const BUCKET_NAME_REGEX = /^[a-zA-Z0-9._-]{3,255}$/;

type AnalysisOptions = {
  featureTypes: FeatureType[];
  queries: unknown[];
  clientRequestToken: string | undefined;
};

type UploadedDocument = {
  key: string;
  versionId: string | undefined;
};
