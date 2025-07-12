import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { listIdDropdown, ListprofileIdsMultiSelectDropdown } from '../common/props';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const unsubscribeProfile = createAction({
  auth: klaviyoAuth,
  name: 'unsubscribeProfile',
  displayName: 'Unsubscribe Profile',
  description: 'Unsubscribe one or more profiles from email marketing, SMS marketing, or both',
  props: {
    list_id: listIdDropdown,
    profileIds: ListprofileIdsMultiSelectDropdown,
    unsubscribeEmail: Property.Checkbox({
      displayName: 'Unsubscribe from Email Marketing',
      required: true,
      defaultValue: true,
    }),
    unsubscribeSms: Property.Checkbox({
      displayName: 'Unsubscribe from SMS Marketing',
      required: true,
      defaultValue: false,
    }),
    unsubscribeSmsTransactional: Property.Checkbox({
      displayName: 'Unsubscribe from SMS Transactional',
      required: true,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const apiKey = auth as string;
    const { list_id, profileIds, unsubscribeEmail, unsubscribeSms, unsubscribeSmsTransactional } = propsValue;

    // Fetch profile details for each selected profileId
    const profilesData = await Promise.all((profileIds as string[]).map(async (profileId) => {
      const profileResp = await makeRequest(apiKey, HttpMethod.GET, `/profiles/${profileId}`, {});
      const profile = profileResp.data;
      const subscriptions: any = {};
      if (unsubscribeEmail) {
        subscriptions.email = { marketing: { consent: 'UNSUBSCRIBED' } };
      }
      if (unsubscribeSms) {
        subscriptions.sms = subscriptions.sms || {};
        subscriptions.sms.marketing = { consent: 'UNSUBSCRIBED' };
      }
      if (unsubscribeSmsTransactional) {
        subscriptions.sms = subscriptions.sms || {};
        subscriptions.sms.transactional = { consent: 'UNSUBSCRIBED' };
      }
      return {
        type: 'profile',
        attributes: {
          email: profile.attributes.email,
          phone_number: profile.attributes.phone_number,
          subscriptions,
        },
      };
    }));

    const body = {
      data: {
        type: 'profile-subscription-bulk-delete-job',
        attributes: {
          profiles: {
            data: profilesData,
          },
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

    const response = await makeRequest(apiKey, HttpMethod.POST, '/profile-subscription-bulk-delete-jobs', body);
    return response;
  },
});
