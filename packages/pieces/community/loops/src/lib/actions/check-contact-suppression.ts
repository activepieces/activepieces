import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { loopsAuth } from '../auth';
import { loopsClient } from '../common/client';
import { loopsProps, loopsSchemas } from '../common/schemas';

export const checkContactSuppression = createAction({
  name: 'check_contact_suppression',
  classification: 'READ',
  displayName: 'Check Contact Suppression',
  description: 'Checks whether a contact is on the Loops suppression list.',
  audience: 'both',
  outputSchema: loopsSchemas.suppression,
  aiMetadata: {
    description:
      'Checks whether one Loops contact, identified by exactly one of email or internal user ID, is suppressed (emails to them are blocked). Returns isSuppressed plus the remaining suppression-removal quota. Read-only.',
    idempotent: true,
  },
  auth: loopsAuth,
  props: {
    identifyBy: loopsProps.identifyByProp({ action: 'check suppression' }),
    value: loopsProps.identifierValueProp(),
  },
  async run(context) {
    const { identifyBy, value } = context.propsValue;
    return loopsClient.request<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/contacts/suppression',
      queryParams: loopsClient.requireOneIdentifier({ identifyBy, value }),
    });
  },
});
