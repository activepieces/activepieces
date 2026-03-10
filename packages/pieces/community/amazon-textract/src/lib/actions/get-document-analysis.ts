import { Property, createAction } from '@activepieces/pieces-framework';
import { GetDocumentAnalysisCommand, JobStatus } from '@aws-sdk/client-textract';
import { Block } from '@aws-sdk/client-textract';
import { amazonTextractAuth } from '../auth';
import {
  createTextractClient,
  parseAnalysisBlocks,
  formatTextractError,
} from '../common';

export const getDocumentAnalysis = createAction({
  auth: amazonTextractAuth,
  name: 'get-document-analysis',
  displayName: 'Get Document Analysis Results',
  description:
    'Retrieve the results of an asynchronous document analysis job started with "Start Document Analysis". If the job is still running, the status will be IN_PROGRESS. For very large documents, results may be paginated — use the returned nextToken to fetch the next page.',
  props: {
    jobId: Property.ShortText({
      displayName: 'Job ID',
      description: 'The job ID returned by the "Start Document Analysis" action.',
      required: true,
    }),
    nextToken: Property.ShortText({
      displayName: 'Next Page Token',
      description:
        'Optional. Pass the nextToken from a previous call to retrieve the next page of results for large documents.',
      required: false,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results Per Page',
      description: 'Maximum number of blocks to return per call (1–1000). Default is 1000.',
      required: false,
      defaultValue: 1000,
    }),
  },
  async run(context) {
    const { jobId, nextToken, maxResults } = context.propsValue;

    try {
      const client = createTextractClient(context.auth.props);

      const response = await client.send(
        new GetDocumentAnalysisCommand({
          JobId: jobId,
          NextToken: nextToken || undefined,
          MaxResults: maxResults ? Math.min(Math.max(maxResults, 1), 1000) : 1000,
        })
      );

      const status = response.JobStatus;
      const warnings =
        response.Warnings?.map((w) => w.ErrorCode ?? '').filter(Boolean) ?? [];

      if (status === JobStatus.FAILED) {
        throw new Error(
          `Document analysis job failed. Status message: ${response.StatusMessage ?? 'No details available.'}`
        );
      }

      if (status === JobStatus.IN_PROGRESS) {
        return {
          status: 'IN_PROGRESS' as const,
          jobId,
          result: undefined,
          nextToken: undefined,
          warnings,
        };
      }

      // SUCCEEDED or PARTIAL_SUCCESS
      const allBlocks: Block[] = response.Blocks ?? [];
      const parsedResult = parseAnalysisBlocks(allBlocks);

      return {
        status: status as 'SUCCEEDED' | 'PARTIAL_SUCCESS',
        jobId,
        result: parsedResult,
        nextToken: response.NextToken ?? undefined,
        warnings,
      };
    } catch (e) {
      const err = e as { message?: string };
      if (err.message?.startsWith('Document analysis job failed')) {
        throw e;
      }
      throw new Error(formatTextractError(e));
    }
  },
});
