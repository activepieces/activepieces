import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { emailitAuth } from '../auth';
import { EmailitApiError, emailitClient } from '../common/client';
import { emailitSchemas } from '../common/output-schemas';
import { emailitValues } from '../common/values';

export const addSuppressionAction = createAction({
  auth: emailitAuth,
  name: 'add_suppression',
  displayName: 'Suppress Email Address',
  description: 'Stop Emailit from sending to an address, permanently or until a date.',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds an address to the Emailit suppression list so API/SMTP sends to it get status suppressed instead of being delivered (type recipient) and campaigns skip it, permanently or until keep_until. If the address already has a suppression of this type, returns it with alreadySuppressed=true. Needs a Full Access key.',
    idempotent: true,
  },
  outputSchema: emailitSchemas.suppression,
  propertyGroups: [{ key: 'suppression', display: 'section', label: 'Suppression', icon: 'sliders', props: ['email', 'type', 'reason', 'keep_until'] }],
  props: {
    email: Property.ShortText({ displayName: 'Email', placeholder: 'ada@example.com', required: true }),
    type: Property.StaticDropdown<'recipient' | 'bounce' | 'complaint' | 'unsubscribe'>({
      displayName: 'Suppression Type',
      description: 'Only Recipient blocks API and SMTP sends. Campaigns skip all types.',
      required: false,
      defaultValue: 'recipient',
      options: { disabled: false, options: [{ label: 'Recipient', value: 'recipient' }, { label: 'Bounce', value: 'bounce' }, { label: 'Complaint', value: 'complaint' }, { label: 'Unsubscribe', value: 'unsubscribe' }] },
    }),
    reason: Property.ShortText({ displayName: 'Reason', description: 'A note for your team.', placeholder: 'Asked to stop receiving invoices', required: false }),
    keep_until: Property.DateTime({ displayName: 'Keep Until', description: 'Leave empty to suppress for good.', required: false }),
  },
  async run({ auth, propsValue }) {
    const body = emailitValues.compact({
      email: emailitValues.requiredText({ value: propsValue.email, label: 'Email' }),
      type: propsValue.type ?? 'recipient',
      reason: emailitValues.optionalText(propsValue.reason),
      keep_until: emailitValues.dateTime(propsValue.keep_until),
    });
    try {
      const created = await emailitClient.request({ auth, method: HttpMethod.POST, path: '/suppressions', body, redactBody: true, safeToRetry: true });
      return { ...unwrap(created), alreadySuppressed: false };
    } catch (error) {
      if (error instanceof EmailitApiError && error.status === 409 && emailitClient.isRecord(error.responseBody)) {
        return { ...unwrap(error.responseBody['existing']), alreadySuppressed: true };
      }
      throw error;
    }
  },
});

function unwrap(value: unknown): Record<string, unknown> {
  if (!emailitClient.isRecord(value)) return {};
  const data = value['data'];
  return emailitClient.isRecord(data) ? data : value;
}
