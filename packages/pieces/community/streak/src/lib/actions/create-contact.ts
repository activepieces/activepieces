import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { streakAuth } from '../common/auth';
import { streakApiCall } from '../common/client';
import { teamDropdown } from '../common/props';

type StreakContact = {
  key: string;
  emailAddresses?: string[];
  givenName?: string;
  familyName?: string;
  title?: string;
  other?: string;
  phoneNumbers?: string[];
  addresses?: string[];
  twitterHandle?: string;
  facebookHandle?: string;
  linkedinHandle?: string;
  photoUrl?: string;
  creationDate?: number;
  lastSavedTimestamp?: number;
};

export const createContactAction = createAction({
  auth: streakAuth,
  name: 'create_contact',
  displayName: 'Create or Find Contact',
  description:
    'Create a contact in a team. If a contact with the same email already exists, return that contact instead of creating a duplicate.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a person contact in a team, or return the existing one if a contact with the same email already exists (get-if-existing upsert keyed on email). Use when an agent needs to ensure a contact exists for a given email before linking it elsewhere; requires the team and at least one email address. Idempotent: repeating with the same email returns the same contact rather than duplicating.',
    idempotent: true,
  },
  props: {
    teamKey: teamDropdown,
    emailAddresses: Property.Array({
      displayName: 'Email Addresses',
      description: 'One or more email addresses for this contact.',
      required: true,
    }),
    givenName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    familyName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Job title or role (e.g. "VP of Sales").',
      required: false,
    }),
    phoneNumbers: Property.Array({
      displayName: 'Phone Numbers',
      required: false,
    }),
    addresses: Property.Array({
      displayName: 'Addresses',
      required: false,
    }),
    twitterHandle: Property.ShortText({
      displayName: 'Twitter Handle',
      description: 'Without the leading @ (e.g. "janedoe").',
      required: false,
    }),
    linkedinHandle: Property.ShortText({
      displayName: 'LinkedIn Handle',
      required: false,
    }),
    other: Property.LongText({
      displayName: 'Notes',
      required: false,
    }),
  },
  async run(context) {
    const {
      teamKey,
      emailAddresses,
      givenName,
      familyName,
      title,
      phoneNumbers,
      addresses,
      twitterHandle,
      linkedinHandle,
      other,
    } = context.propsValue;

    const body: Record<string, unknown> = {
      emailAddresses: emailAddresses as string[],
    };
    if (givenName) body['givenName'] = givenName;
    if (familyName) body['familyName'] = familyName;
    if (title) body['title'] = title;
    if (phoneNumbers && phoneNumbers.length > 0) body['phoneNumbers'] = phoneNumbers;
    if (addresses && addresses.length > 0) body['addresses'] = addresses;
    if (twitterHandle) body['twitterHandle'] = twitterHandle;
    if (linkedinHandle) body['linkedinHandle'] = linkedinHandle;
    if (other) body['other'] = other;

    const response = await streakApiCall<StreakContact>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/api/v2/teams/${teamKey}/contacts`,
      queryParams: { getIfExisting: 'true' },
      contentType: 'application/json',
      body,
    });

    const contact = response.body;
    return {
      contact_key: contact.key,
      given_name: contact.givenName ?? null,
      family_name: contact.familyName ?? null,
      title: contact.title ?? null,
      email_addresses: Array.isArray(contact.emailAddresses)
        ? contact.emailAddresses.join(', ')
        : null,
      phone_numbers: Array.isArray(contact.phoneNumbers)
        ? contact.phoneNumbers.join(', ')
        : null,
      addresses: Array.isArray(contact.addresses)
        ? contact.addresses.join(', ')
        : null,
      twitter_handle: contact.twitterHandle ?? null,
      facebook_handle: contact.facebookHandle ?? null,
      linkedin_handle: contact.linkedinHandle ?? null,
      photo_url: contact.photoUrl ?? null,
      other: contact.other ?? null,
      creation_date_epoch_ms: contact.creationDate ?? null,
      last_saved_timestamp_epoch_ms: contact.lastSavedTimestamp ?? null,
    };
  },
});
