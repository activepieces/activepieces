import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth, KlaviyoAuthValue } from '../common/auth';
import { listIdDropdown, profileIdsMultiSelectDropdown } from '../common/props';
import { fetchProfilesByIds, makeRequest, normalizeProfileIds } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const subscribeProfile = createAction({
  auth: klaviyoAuth,
  name: 'subscribeProfile',
  displayName: 'Subscribe Profile',
  description: 'Subscribe profiles to email or SMS marketing on a list.',
  props: {
    list_id: listIdDropdown,
    profile_ids: profileIdsMultiSelectDropdown,
    subscribe_email: Property.Checkbox({
      displayName: 'Subscribe to Email',
      description: 'Subscribe selected profiles to email marketing.',
      required: false,
      defaultValue: true,
    }),
    subscribe_sms: Property.Checkbox({
      displayName: 'Subscribe to SMS',
      description: 'Subscribe selected profiles to SMS marketing.',
      required: false,
      defaultValue: false,
    }),
    historical_import: Property.Checkbox({
      displayName: 'Historical Import',
      description: 'Bypass double opt-in and mark as a historical import.',
      required: false,
      defaultValue: false,
    }),
    consented_at: Property.ShortText({
      displayName: 'Consent Date',
      description:
        'ISO 8601 datetime when consent was given (required for historical import, e.g. 2024-01-15T10:00:00Z).',
      required: false,
    }),
    custom_source: Property.ShortText({
      displayName: 'Custom Source',
      description: 'Label for the subscription source (e.g. "Website Form").',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      list_id,
      profile_ids: rawProfileIds,
      subscribe_email,
      subscribe_sms,
      historical_import,
      consented_at,
      custom_source,
    } = propsValue;
    const profile_ids = normalizeProfileIds(rawProfileIds);

    if (!profile_ids || profile_ids.length === 0) {
      throw new Error('At least one profile must be selected.');
    }
    if (profile_ids.length > 1000) {
      throw new Error('Maximum of 1000 profiles can be subscribed at once.');
    }
    if (!subscribe_email && !subscribe_sms) {
      throw new Error(
        'At least one subscription channel must be selected (Email or SMS).'
      );
    }
    if (historical_import && !consented_at) {
      throw new Error(
        'Consent Date is required when Historical Import is enabled.'
      );
    }

    // Batch-fetch profile details to include email/phone_number (required by Klaviyo)
    const profileMap = await fetchProfilesByIds(auth as KlaviyoAuthValue, profile_ids as string[]);

    const profileData = (profile_ids as string[]).map((profileId) => {
      const attrs = profileMap.get(profileId) ?? {};
      const subscriptions: any = {};

      if (subscribe_email) {
        subscriptions.email = { marketing: { consent: 'SUBSCRIBED' } };
        if (historical_import && consented_at) {
          subscriptions.email.marketing.consented_at = consented_at;
        }
      }
      if (subscribe_sms) {
        subscriptions.sms = { marketing: { consent: 'SUBSCRIBED' } };
        if (historical_import && consented_at) {
          subscriptions.sms.marketing.consented_at = consented_at;
        }
      }

      const profileAttrs: any = { subscriptions };
      if (subscribe_email && attrs.email) profileAttrs.email = attrs.email;
      if (subscribe_sms && attrs.phone_number)
        profileAttrs.phone_number = attrs.phone_number;

      return { type: 'profile', id: profileId, attributes: profileAttrs };
    });

    const requestBody: any = {
      data: {
        type: 'profile-subscription-bulk-create-job',
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
    if (custom_source) {
      requestBody.data.attributes.custom_source = custom_source;
    }
    if (historical_import) {
      requestBody.data.attributes.historical_import = true;
    }

    const response = await makeRequest(
      auth as unknown as KlaviyoAuthValue,
      HttpMethod.POST,
      '/profile-subscription-bulk-create-jobs',
      requestBody
    );

    return {
      success: true,
      job_id: response?.data?.id,
      profiles_count: profileData.length,
      list_id: list_id || null,
      subscribed_email: subscribe_email ?? false,
      subscribed_sms: subscribe_sms ?? false,
      historical_import: historical_import ?? false,
    };
  },
});
