import { createAction, Property } from '@activepieces/pieces-framework';
import { instantVerify } from '../api';
import { clearoutAuth } from '../auth';

export const instantVerifyAction = createAction({
  name: 'instant_verify',
  auth: clearoutAuth,
  displayName: 'Instant Verify',
  description: 'Instant Verify an email address',
  audience: 'both',
  aiMetadata: {
    description: 'Validates a single email address in real time via Clearout, checking deliverability, validity, and risk signals (e.g. role-based, disposable, gibberish). Use to verify one email before sending or storing it. Requires the email address as input; consumes a Clearout credit per call. Idempotent: re-verifying the same address returns the same assessment without side effects.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address to verify',
      required: true,
    }),
  },
  async run(context) {
    return await instantVerify(context.auth.props, {
      email: context.propsValue.email,
    });
  },
});
