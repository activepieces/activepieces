import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { countryCodeDropdown, listIdDropdown, ListprofileIdsMultiSelectDropdown } from '../common/props';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const subscribeProfile = createAction({
  auth: klaviyoAuth,
  name: 'subscribeProfile',
  displayName: 'Subscribe Profile',
  description: 'Subscribe one or more profiles to email marketing, SMS marketing, or both',
  props: {
    list_id: listIdDropdown,
    profileIds: ListprofileIdsMultiSelectDropdown,
    subscribeEmail: Property.Checkbox({
      displayName: 'Subscribe to Email Marketing',
      required: true,
      defaultValue: true,
    }),
    subscribeSms: Property.Checkbox({
      displayName: 'Subscribe to SMS Marketing',
      required: true,
      defaultValue: false,
    }),
    subscribeSmsTransactional: Property.Checkbox({
      displayName: 'Subscribe to SMS Transactional',
      required: true,
      defaultValue: false,
    }),
    customSource: Property.ShortText({
      displayName: 'Custom Source',
      required: false,
      defaultValue: 'Marketing Event',
    }),
    historicalImport: Property.Checkbox({
      displayName: 'Historical Import',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const apiKey = auth as string;
    const { list_id, profileIds, subscribeEmail, subscribeSms, subscribeSmsTransactional, customSource, historicalImport } = propsValue;

    // Fetch profile details for each selected profileId
    const profilesData = await Promise.all((profileIds as string[]).map(async (profileId) => {
      const profileResp = await makeRequest(apiKey, HttpMethod.GET, `/profiles/${profileId}`, {});
      const profile = profileResp.data;
      const subscriptions: any = {};
      if (subscribeEmail) {
        subscriptions.email = { marketing: { consent: 'SUBSCRIBED' } };
      }
      if (subscribeSms) {
        subscriptions.sms = subscriptions.sms || {};
        subscriptions.sms.marketing = { consent: 'SUBSCRIBED' };
      }
      if (subscribeSmsTransactional) {
        subscriptions.sms = subscriptions.sms || {};
        subscriptions.sms.transactional = { consent: 'SUBSCRIBED' };
      }
      return {
        type: 'profile',
        id: profile.id,
        attributes: {
          email: profile.attributes.email,
          phone_number: profile.attributes.phone_number,
          subscriptions,
        },
      };
    }));

    const body = {
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          profiles: {
            data: profilesData,
          },
          historical_import: historicalImport ?? false,
          custom_source: customSource || 'Marketing Event',
        },
        relationships: {
          list: {
            data: {
              type: 'list',
              id: list_id,
            },
          },
        },
      },
    };

    const response = await makeRequest(apiKey, HttpMethod.POST, '/profile-subscription-bulk-create-jobs', body);
    return response;
  },
});
