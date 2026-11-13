import { createAction } from '@activepieces/pieces-framework';
import { emailitAuth } from '../auth';
import { emailitOperations } from '../common/operations';
import { emailitSchemas } from '../common/output-schemas';
import { emailitProps } from '../common/props';

export const cancelEmailAction = createAction({
  auth: emailitAuth,
  name: 'cancel_email',
  displayName: 'Cancel Scheduled Email',
  description: 'Cancel an email that is scheduled, queued or waiting to retry.',
  audience: 'both',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Cancels an Emailit email that is still scheduled, accepted (queued) or attempted (retrying); sent emails cannot be recalled and the credit is not refunded. Best effort: in_flight=true means a delivery attempt may still complete. A repeat call on an already canceled email returns alreadyCanceled=true instead of failing.',
    idempotent: true,
  },
  outputSchema: emailitSchemas.canceled,
  props: {
    email_id: emailitProps.emailId(),
  },
  async run({ auth, propsValue }) {
    return emailitOperations.cancelEmail({ auth, emailId: propsValue.email_id });
  },
});
