import { DedupeStrategy, Polling } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { formioAuth } from '../auth';
import { FormioSubmission, formioCommon } from '../common/client';

const SAMPLE_PAGE_SIZE = 25;

export function submissionSample(
  timestampField: SubmissionTimestamp
): Polling<FormioAuthValue, { formPath: string }> {
  return {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue }) => {
      const { submissions } = await formioCommon.findSubmissions({
        auth: auth.props,
        formPath: propsValue.formPath,
        queryParams: {
          limit: String(SAMPLE_PAGE_SIZE),
          sort: `-${timestampField}`,
        },
      });

      return submissions
        .filter((submission) => wasEdited({ submission, timestampField }))
        .map((submission) => ({
          epochMilliSeconds: timestampOf({ submission, timestampField }),
          data: submission,
        }));
    },
  };
}

function wasEdited({
  submission,
  timestampField,
}: {
  submission: FormioSubmission;
  timestampField: SubmissionTimestamp;
}): boolean {
  if (timestampField !== 'modified') {
    return true;
  }
  return submission.modified !== submission.created;
}

function timestampOf({
  submission,
  timestampField,
}: {
  submission: FormioSubmission;
  timestampField: SubmissionTimestamp;
}): number {
  const value = submission[timestampField] ?? submission.created;
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isNaN(parsed) ? 0 : parsed;
}

export type SubmissionTimestamp = 'created' | 'modified';

export type FormioAuthValue = AppConnectionValueForAuthProperty<
  typeof formioAuth
>;
