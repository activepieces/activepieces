import { DedupeStrategy, Polling } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { formioAuth } from '../auth';
import { FormioSubmission, formioCommon } from '../common/client';

const PAGE_SIZE = 100;

export function submissionPolling(
  timestampField: SubmissionTimestamp
): Polling<FormioAuthValue, { formPath: string }> {
  return {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
      const hasCursor = !!lastFetchEpochMS && lastFetchEpochMS > 0;

      const queryParams: Record<string, string> = {
        limit: String(PAGE_SIZE),
        sort: hasCursor ? timestampField : `-${timestampField}`,
      };
      if (hasCursor) {
        queryParams[`${timestampField}__gt`] = new Date(
          lastFetchEpochMS
        ).toISOString();
      }

      const { submissions } = await formioCommon.findSubmissions({
        auth: auth.props,
        formPath: propsValue.formPath,
        queryParams,
      });

      return submissions
        .filter((submission) => wasEdited(submission, timestampField))
        .map((submission) => ({
          epochMilliSeconds: timestampOf(submission, timestampField),
          data: submission,
        }));
    },
  };
}

function wasEdited(
  submission: FormioSubmission,
  timestampField: SubmissionTimestamp
): boolean {
  if (timestampField !== 'modified') {
    return true;
  }
  return submission.modified !== submission.created;
}

function timestampOf(
  submission: FormioSubmission,
  timestampField: SubmissionTimestamp
): number {
  const value = submission[timestampField] ?? submission.created;
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isNaN(parsed) ? 0 : parsed;
}

export const SUBMISSION_POLL_PAGE_SIZE = PAGE_SIZE;

export type SubmissionTimestamp = 'created' | 'modified';

export type FormioAuthValue = AppConnectionValueForAuthProperty<
  typeof formioAuth
>;
