import { createAction, Property } from '@activepieces/pieces-framework';

import { googleAdsAuth } from '../auth';
import { googleAdsApi } from '../common/api';
import { googleAdsProps } from '../common/props';
import type { GoogleAdsConsentStatus } from '../common/types';
import { googleAdsUtils } from '../common/utils';
import { customerMatchOutputSchema } from '../output-schemas';

const CONSENT_OPTIONS: { label: string; value: GoogleAdsConsentStatus }[] = [
  { label: 'Granted', value: 'GRANTED' },
  { label: 'Denied', value: 'DENIED' },
  { label: 'Unspecified', value: 'UNSPECIFIED' },
];

export const addCustomerMatchData = createAction({
  name: 'addCustomerMatchData',
  classification: 'WRITE',
  displayName: 'Add Customer Match Data',
  description: 'Upload e-mails, phones or addresses to a Customer Match audience list (Data Manager API)',
  audience: 'both',
  aiMetadata: {
    description:
      'Add people to a CRM-based Customer Match audience list by e-mail, phone or full address; e-mails, phones, first and last names are normalized and SHA-256 hashed before upload, while country code and postal code are sent unhashed (trimmed, country code uppercased), as Google requires. Use to grow an audience for targeting; to take people out use Remove customer match data. Requires consent values and confirmation that the Customer Match terms were accepted. Processing is asynchronous; re-adding the same members does not duplicate them.',
    idempotent: true,
  },
  auth: googleAdsAuth,
  props: {
    customerId: googleAdsProps.customerId({ required: true }),
    userList: googleAdsProps.userList({ required: true }),
    members: googleAdsProps.members({ required: true }),
    adUserData: Property.StaticDropdown<GoogleAdsConsentStatus, true>({
      displayName: 'Consent: Ad User Data',
      description:
        'Consent the members gave for their data to be used for advertising (required by Google for uploads, enforced in the EEA). Pick the value that matches what the members actually agreed to.',
      required: true,
      options: { options: CONSENT_OPTIONS },
    }),
    adPersonalization: Property.StaticDropdown<GoogleAdsConsentStatus, true>({
      displayName: 'Consent: Ad Personalization',
      description: 'Consent the members gave for personalized advertising. Pick the value that matches what the members actually agreed to.',
      required: true,
      options: { options: CONSENT_OPTIONS },
    }),
    acceptTerms: Property.Checkbox({
      displayName: 'Customer Match Terms Accepted',
      description:
        'Google requires every upload to confirm that the advertiser accepted the Customer Match terms of service (https://support.google.com/adspolicy/answer/6299717). Tick to confirm.',
      required: true,
      defaultValue: false,
    }),
    waitForCompletion: googleAdsProps.waitForCompletion({ required: false }),
  },
  outputSchema: customerMatchOutputSchema,
  async run(context) {
    const { customerId, userList, members, adUserData, adPersonalization, acceptTerms, waitForCompletion } = context.propsValue;
    if (!acceptTerms) {
      throw new Error('Customer Match uploads require the advertiser to accept Google\'s Customer Match terms of service. Tick "Customer Match Terms Accepted".');
    }
    return await googleAdsApi.uploadCustomerMatch({
      auth: context.auth,
      customerId,
      userList,
      members: (members ?? []).map(googleAdsUtils.toMemberInput),
      mode: 'add',
      consent: { adUserData, adPersonalization },
      waitForCompletion: Boolean(waitForCompletion),
    });
  },
});
