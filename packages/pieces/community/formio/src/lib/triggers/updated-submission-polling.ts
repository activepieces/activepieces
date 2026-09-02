import { registerPollingSubmissionTrigger } from './register-polling-trigger';

export const updatedSubmissionPolling = registerPollingSubmissionTrigger({
  name: 'updated_submission_polling',
  displayName: 'Updated Submission (Polling)',
  description:
    'Checks the form on a schedule for edited submissions, for servers that cannot reach this instance',
  aiDescription:
    'Fires when an existing submission on the chosen Form.io form is edited, discovered by polling rather than by webhook. Submissions that have never been edited are ignored, so a brand-new submission does not appear here. Choose this over Updated Submission when the Form.io server cannot reach this Activepieces instance.',
  timestampField: 'modified',
});
