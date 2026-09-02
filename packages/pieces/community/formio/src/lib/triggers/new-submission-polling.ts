import { registerPollingSubmissionTrigger } from './register-polling-trigger';

export const newSubmissionPolling = registerPollingSubmissionTrigger({
  name: 'new_submission_polling',
  displayName: 'New Submission (Polling)',
  description:
    'Checks the form on a schedule for new submissions, for servers that cannot reach this instance',
  aiDescription:
    'Fires when the chosen Form.io form receives a new submission, discovered by polling the form on a schedule rather than by webhook. Choose this over New Submission when the Form.io server cannot reach this Activepieces instance, for example an on-premise deployment with no inbound path. The payload is the saved submission.',
  timestampField: 'created',
});
