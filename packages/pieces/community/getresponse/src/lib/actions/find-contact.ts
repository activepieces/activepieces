import { createAction, Property } from '@activepieces/pieces-framework';

import { getresponseAuth } from '../common/auth';
import {
  flattenGetResponseContact,
  listGetResponseContacts,
} from '../common/client';
import { getresponseProps } from '../common/props';

export const findContactAction = createAction({
  auth: getresponseAuth,
  name: 'find-contact',
  displayName: 'Find Contact',
  description: 'Finds a contact by email address.',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up a GetResponse contact by exact email address, optionally scoped to a single campaign; without a campaign it searches across the account. Use to check whether a subscriber exists or to retrieve their details before acting. Read-only and idempotent; returns a found flag indicating whether a match was located.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the contact to find.',
      required: true,
    }),
    campaignId: getresponseProps.campaign(false),
  },
  async run(context) {
    const contacts = await listGetResponseContacts({
      auth: context.auth,
      email: context.propsValue.email,
      campaignId: context.propsValue.campaignId,
    });

    const matchingContact = contacts.find(
      (contact) =>
        contact.email.toLowerCase() === context.propsValue.email.toLowerCase(),
    );

    if (!matchingContact) {
      return {
        found: false,
        email: context.propsValue.email,
        campaign_id: context.propsValue.campaignId ?? null,
      };
    }

    return {
      found: true,
      ...flattenGetResponseContact(matchingContact),
    };
  },
});
