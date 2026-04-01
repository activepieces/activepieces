import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth, KlaviyoAuthValue } from '../common/auth';
import { listIdDropdown, profileIdsMultiSelectDropdown } from '../common/props';
import { makeRequest, normalizeProfileIds } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const unsubscribeProfile = createAction({
  auth: klaviyoAuth,
  name: 'unsubscribeProfile',
  displayName: 'Unsubscribe Profile',
  description: 'Unsubscribe profiles from email or SMS marketing on a list.',
  props: {
    list_id: listIdDropdown,
    profile_ids: profileIdsMultiSelectDropdown,
    unsubscribe_email: Property.Checkbox({
      displayName: 'Unsubscribe from Email',
      description: 'Unsubscribe selected profiles from email marketing.',
      required: false,
      defaultValue: true,
    }),
    unsubscribe_sms: Property.Checkbox({
      displayName: 'Unsubscribe from SMS',
      description: 'Unsubscribe selected profiles from SMS marketing.',
      required: false,
      defaultValue: false,
    }),
    unsubscribe_sms_transactional: Property.Checkbox({
      displayName: 'Unsubscribe from SMS Transactional',
      description:
        'Unsubscribe selected profiles from SMS transactional messages.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      list_id,
      profile_ids: rawProfileIds,
      unsubscribe_email,
      unsubscribe_sms,
      unsubscribe_sms_transactional,
    } = propsValue;
    const profile_ids = normalizeProfileIds(rawProfileIds);

    if (!profile_ids || profile_ids.length === 0) {
      throw new Error('At least one profile must be selected.');
    }
    if (profile_ids.length > 100) {
      throw new Error('Maximum of 100 profiles can be unsubscribed at once.');
    }
    if (
      !unsubscribe_email &&
      !unsubscribe_sms &&
      !unsubscribe_sms_transactional
    ) {
      throw new Error('At least one unsubscribe channel must be selected.');
    }

    // Fetch profile details to include email/phone_number
    const profileDetails = await Promise.all(
      (profile_ids as string[]).map((id) =>
        makeRequest(
          auth as unknown as KlaviyoAuthValue,
          HttpMethod.GET,
          `/profiles/${id}`,
          {}
        )
      )
    );

    const profileData = (profile_ids as string[]).map((profileId, index) => {
      const attrs = profileDetails[index]?.data?.attributes ?? {};
      const subscriptions: any = {};

      if (unsubscribe_email) {
        subscriptions.email = { marketing: { consent: 'UNSUBSCRIBED' } };
      }
      if (unsubscribe_sms) {
        subscriptions.sms = subscriptions.sms || {};
        subscriptions.sms.marketing = { consent: 'UNSUBSCRIBED' };
      }
      if (unsubscribe_sms_transactional) {
        subscriptions.sms = subscriptions.sms || {};
        subscriptions.sms.transactional = { consent: 'UNSUBSCRIBED' };
      }

      const profileAttrs: any = { subscriptions };
      if (unsubscribe_email && attrs.email) profileAttrs.email = attrs.email;
      if (
        (unsubscribe_sms || unsubscribe_sms_transactional) &&
        attrs.phone_number
      ) {
        profileAttrs.phone_number = attrs.phone_number;
      }

      return { type: 'profile', id: profileId, attributes: profileAttrs };
    });

    const requestBody: any = {
      data: {
        type: 'profile-subscription-bulk-delete-job',
        attributes: {
          profiles: { data: profileData },
        },
      },
    };

    if (list_id) {
      requestBody.data.relationships = {
        list: { data: { type: 'list', id: list_id } },
      };
    }

    const response = await makeRequest(
      auth as unknown as KlaviyoAuthValue,
      HttpMethod.POST,
      '/profile-subscription-bulk-delete-jobs',
      requestBody
    );

    return {
      success: true,
      job_id: response?.data?.id,
      profiles_count: profileData.length,
      list_id: list_id || null,
      unsubscribed_email: unsubscribe_email ?? false,
      unsubscribed_sms: unsubscribe_sms ?? false,
      unsubscribed_sms_transactional: unsubscribe_sms_transactional ?? false,
    };
  },
});