import { registerSubmissionTrigger } from './register-submission-trigger';

export const newSubmission = registerSubmissionTrigger({
  name: 'new_submission',
  displayName: 'New Submission',
  description: 'Fires when a form receives a new submission',
  aiDescription:
    'Fires when the chosen Form.io form receives a new submission. The payload is the saved submission: its id, the submitted data keyed by the form component keys, the owner, and the created and modified timestamps. Use it to start a flow on citizen or customer form intake.',
  events: ['create'],
  timestampField: 'created',
});
