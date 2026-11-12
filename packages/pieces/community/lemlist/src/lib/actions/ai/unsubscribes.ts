import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { isLemlistStatus, lemlistApiCall } from '../../common/client';
import { aiProps } from '../../common/ai-props';
import { lemlistAuth } from '../../common/constants';
import { lemlistInput } from '../../common/input';
import { lemlistResults } from '../../common/results';
import { lemlistSchemas } from '../../common/schemas';

function emailOrDomainProp() {
  return Property.ShortText({
    displayName: 'Email or Domain',
    description: 'An email address (jane@acme.com) or a whole domain (acme.com).',
    required: true,
  });
}

export const listUnsubscribesAction = createAction({
  auth: lemlistAuth,
  name: 'list_unsubscribes',
  classification: 'SEARCH',
  displayName: 'List Unsubscribes',
  description: 'Lists unsubscribed emails and domains.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the team-wide unsubscribe (do-not-contact) list: emails and domains with source and date. Limit 1-100 (default 100) and Offset; has_more=true means call again with Offset + Limit. Read-only.',
    idempotent: true,
  },
  props: {
    limit: aiProps.limit({ max: 100, fallback: 100 }),
    offset: aiProps.offset(),
  },
  outputSchema: lemlistSchemas.unsubscribePage,
  async run({ auth, propsValue }) {
    const limit = lemlistInput.boundedInt({ value: propsValue.limit, label: 'Limit', min: 1, max: 100 }) ?? 100;
    const offset = lemlistInput.boundedInt({ value: propsValue.offset, label: 'Offset', min: 0, max: 1_000_000 }) ?? 0;
    const body = await lemlistApiCall<unknown>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/unsubscribes',
      query: { limit, offset },
    });
    return lemlistResults.page({ items: lemlistResults.listFrom({ body }), offset, limit });
  },
});

export const getUnsubscribeAction = createAction({
  auth: lemlistAuth,
  name: 'get_unsubscribe',
  classification: 'READ',
  displayName: 'Check Unsubscribe',
  description: 'Checks whether an email or domain is on the unsubscribe list.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Checks whether one email or domain is on the team unsubscribe (do-not-contact) list. Returns unsubscribed=true with the record, or unsubscribed=false. Read-only.',
    idempotent: true,
  },
  props: { value: emailOrDomainProp() },
  outputSchema: lemlistSchemas.unsubscribeStatus,
  async run({ auth, propsValue }) {
    try {
      const record = await lemlistApiCall({
        apiKey: auth.secret_text,
        method: HttpMethod.GET,
        resourceUri: `/unsubscribes/${lemlistInput.emailOrDomainSegment({ value: propsValue.value, label: 'Email or Domain' })}`,
      });
      return { unsubscribed: true, record };
    } catch (error) {
      if (isLemlistStatus({ error, status: 404 })) {
        return { unsubscribed: false, record: null };
      }
      throw error;
    }
  },
});

export const addUnsubscribeAction = createAction({
  auth: lemlistAuth,
  name: 'add_unsubscribe',
  classification: 'WRITE',
  displayName: 'Add Unsubscribe',
  description: 'Adds an email or domain to the unsubscribe list.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds an email or a whole domain to the team unsubscribe (do-not-contact) list, so no campaign contacts it any more. Use to honour an opt-out. Idempotent: adding an existing entry keeps it.',
    idempotent: true,
  },
  props: { value: emailOrDomainProp() },
  outputSchema: lemlistSchemas.unsubscribe,
  async run({ auth, propsValue }) {
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: `/unsubscribes/${lemlistInput.emailOrDomainSegment({ value: propsValue.value, label: 'Email or Domain' })}`,
    });
  },
});

export const resubscribeEmailAction = createAction({
  auth: lemlistAuth,
  name: 'resubscribe_email',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove from Unsubscribe List',
  description: 'Removes an email or domain from the unsubscribe list. Only when the person opted back in.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes an email or domain from the unsubscribe (do-not-contact) list so campaigns can contact it again. Only call when the person explicitly opted back in: emailing someone who unsubscribed can break anti-spam and privacy law. Returns removed=false when the entry was not on the list, so a retry is safe.',
    idempotent: true,
  },
  props: { value: emailOrDomainProp() },
  outputSchema: {
    fields: [
      { key: 'removed', label: 'Removed', format: 'boolean' },
      { key: 'record', label: 'Record', children: lemlistSchemas.unsubscribe.fields },
    ],
  },
  async run({ auth, propsValue }) {
    try {
      const record = await lemlistApiCall({
        apiKey: auth.secret_text,
        method: HttpMethod.DELETE,
        resourceUri: `/unsubscribes/${lemlistInput.emailOrDomainSegment({ value: propsValue.value, label: 'Email or Domain' })}`,
      });
      return { removed: true, record };
    } catch (error) {
      if (isLemlistStatus({ error, status: 404 })) {
        return { removed: false, record: null };
      }
      throw error;
    }
  },
});
