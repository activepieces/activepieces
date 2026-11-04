import { Property } from '@activepieces/pieces-framework';

export const jobIdProp = Property.ShortText({
  displayName: 'Job ID',
  description:
    'The ID returned by Start Batch Verification, or the job ID from the Verification Job Finished trigger.',
  required: true,
});
