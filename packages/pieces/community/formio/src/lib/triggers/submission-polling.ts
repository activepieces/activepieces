import { DedupeStrategy, Polling } from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  Store,
} from '@activepieces/pieces-framework';
import { formioAuth } from '../auth';
import { FormioSubmission, formioCommon } from '../common/client';

const PAGE_SIZE = 100;

export function submissionPolling(
  timestampField: SubmissionTimestamp
): Polling<FormioAuthValue, { formPath: string }> {
  return {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS, store }) => {
      const isSampleRun = !lastFetchEpochMS || lastFetchEpochMS <= 0;
      const cursorKey = highWaterMarkKey({
        timestampField,
        formPath: propsValue.formPath,
      });

      const storedHighWaterMark = isSampleRun
        ? 0
        : (await store.get<number>(cursorKey)) ?? 0;
      const cursor = isSampleRun
        ? 0
        : Math.max(storedHighWaterMark, lastFetchEpochMS);

      const queryParams: Record<string, string> = {
        limit: String(PAGE_SIZE),
        sort: cursor > 0 ? timestampField : `-${timestampField}`,
      };
      if (cursor > 0) {
        queryParams[`${timestampField}__gt`] = new Date(cursor).toISOString();
      }

      const { submissions } = await formioCommon.findSubmissions({
        auth: auth.props,
        formPath: propsValue.formPath,
        queryParams,
      });

      if (!isSampleRun && submissions.length > 0) {
        const pageHighWaterMark = Math.max(
          ...submissions.map((submission) =>
            timestampOf(submission, timestampField)
          )
        );
        if (pageHighWaterMark > cursor) {
          await store.put(cursorKey, pageHighWaterMark);
        }
      }

      return submissions
        .filter((submission) => wasEdited(submission, timestampField))
        .map((submission) => ({
          epochMilliSeconds: timestampOf(submission, timestampField),
          data: submission,
        }));
    },
  };
}

function highWaterMarkKey({
  timestampField,
  formPath,
}: {
  timestampField: SubmissionTimestamp;
  formPath: string;
}): string {
  return `formio_high_water_mark_${timestampField}_${formPath}`;
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

export type SubmissionPollingStore = Store;
