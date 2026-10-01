import { registerSubmissionTrigger } from './register-submission-trigger';

export const updatedSubmission = registerSubmissionTrigger({
  name: 'updated_submission',
  displayName: 'Updated Submission',
  description: 'Fires when an existing submission is changed',
  aiDescription:
    'Fires when an existing submission on the chosen Form.io form is updated. The payload is the submission as it stands after the change, so compare the created and modified timestamps to tell an edit from an original intake. Use it to react to a record being corrected or progressed.',
  events: ['update'],
  timestampField: 'modified',
});
