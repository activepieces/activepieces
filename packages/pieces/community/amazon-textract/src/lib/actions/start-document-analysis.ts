import { Property, createAction } from '@activepieces/pieces-framework';
import {
  StartDocumentAnalysisCommand,
  FeatureType,
} from '@aws-sdk/client-textract';
import { amazonTextractAuth } from '../auth';
import { createTextractClient, formatTextractError } from '../common';

export const startDocumentAnalysis = createAction({
  auth: amazonTextractAuth,
  name: 'start-document-analysis',
  displayName: 'Start Document Analysis',
  description:
    'Start an asynchronous analysis job for a multi-page document stored in S3. Returns a job ID that you can pass to the "Get Document Analysis Results" action to retrieve the extracted data once the job completes.',
  props: {
    s3Bucket: Property.ShortText({
      displayName: 'S3 Bucket',
      description: 'The S3 bucket containing the document to analyze.',
      required: true,
    }),
    s3Key: Property.ShortText({
      displayName: 'S3 File Path',
      description: 'The path to the document in your S3 bucket (e.g. "reports/multi-page.pdf"). Supports multi-page PDFs and TIFF files.',
      required: true,
    }),
    featureTypes: Property.StaticMultiSelectDropdown({
      displayName: 'Feature Types',
      description: 'Select what to extract. TABLES extracts table data. FORMS extracts key-value pairs. SIGNATURES detects signatures.',
      required: true,
      options: {
        options: [
          { label: 'Tables', value: FeatureType.TABLES },
          { label: 'Forms (Key-Value Pairs)', value: FeatureType.FORMS },
          { label: 'Signatures', value: FeatureType.SIGNATURES },
        ],
      },
      defaultValue: [FeatureType.TABLES, FeatureType.FORMS],
    }),
    clientRequestToken: Property.ShortText({
      displayName: 'Deduplication Token (Optional)',
      description:
        'A unique string you choose (e.g. "job-invoice-2024-01"). If you submit the same token within 5 minutes, AWS returns the original job ID instead of starting a new job — preventing duplicate work.',
      required: false,
    }),
    outputS3Bucket: Property.ShortText({
      displayName: 'Output S3 Bucket (Optional)',
      description: 'S3 bucket where Textract will save the raw analysis output. Leave blank to retrieve results using "Get Document Analysis Results" instead.',
      required: false,
    }),
    outputS3Prefix: Property.ShortText({
      displayName: 'Output Folder Path (Optional)',
      description: 'Folder path within the output bucket where results will be saved (e.g. "textract-output/"). Only used if Output S3 Bucket is set.',
      required: false,
    }),
  },
  async run(context) {
    const {
      s3Bucket,
      s3Key,
      featureTypes,
      clientRequestToken,
      outputS3Bucket,
      outputS3Prefix,
    } = context.propsValue;

    try {
      const client = createTextractClient(context.auth.props);

      const response = await client.send(
        new StartDocumentAnalysisCommand({
          DocumentLocation: {
            S3Object: { Bucket: s3Bucket, Name: s3Key },
          },
          FeatureTypes: featureTypes as FeatureType[],
          ClientRequestToken: clientRequestToken || undefined,
          OutputConfig:
            outputS3Bucket
              ? { S3Bucket: outputS3Bucket, S3Prefix: outputS3Prefix || undefined }
              : undefined,
        })
      );

      return {
        jobId: response.JobId ?? '',
        message:
          'Analysis job started. Use the "Get Document Analysis Results" action with this job ID to retrieve the results once the job completes (usually within a few minutes).',
      };
    } catch (e) {
      throw new Error(formatTextractError(e));
    }
  },
});
