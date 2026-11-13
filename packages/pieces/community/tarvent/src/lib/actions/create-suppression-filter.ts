import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventTransport } from '../common/transport';
import { tarventOutputSchemas } from '../output-schemas';

export const createSuppressionFilter = createAction({
  auth: tarventAuth,
  name: 'tarvent_create_suppression_filter',
  classification: 'WRITE',
  displayName: 'Add Contact To Suppression List',
  description: 'Creates a suppression filter in your account so an email address receives no more email.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds one email address to the Tarvent account-level suppression list (with an optional reason up to 255 characters) so no campaign or transactional email is sent to it from any audience. Reversible with Remove From Suppression List. Returns the filter ID. Not idempotent: each call creates another suppression filter record.',
    idempotent: false,
  },
  outputSchema: tarventOutputSchemas.suppressionFilter,
  props: {
    email: Property.ShortText({
      displayName: 'Email address',
      description: 'The email to add to the suppression list.',
      required: true,
    }),
    reason: Property.LongText({
      displayName: 'Suppression reason',
      description: 'Why this contact is being suppressed (255 character limit).',
      required: false,
    }),
  },
  async run(context) {
    const email = tarventCommon.requireText({ value: context.propsValue.email, label: 'Email address' });
    const reason = tarventCommon.trimmed(context.propsValue.reason);
    tarventCommon.checkLength({ value: email, label: 'Email address', max: 320 });
    tarventCommon.checkLength({ value: reason, label: 'Suppression reason', max: 255 });
    const { localPart, domain } = tarventCommon.splitEmail(email);
    return tarventTransport.field<Record<string, unknown>>({
      auth: context.auth.props,
      query: 'mutation CreateSuppressionFilter($input: CreateSuppressionFilterInput!) { createAccountSuppressionFilter(input: $input) { id localPart domain reason createdUtc } }',
      variables: { input: { localPart, domain, reason: reason ?? '' } },
      name: 'createAccountSuppressionFilter',
    });
  },
});

