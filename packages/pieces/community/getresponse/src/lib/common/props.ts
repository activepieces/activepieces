import { Property } from '@activepieces/pieces-framework';

import { getresponseAuth, GetResponseAuthValue } from './auth';
import { listGetResponseCampaigns, listGetResponseFromFields } from './client';

export const getresponseProps = {
  campaign: (required = true) =>
    Property.Dropdown({
      auth: getresponseAuth,
      displayName: 'Campaign',
      description: 'Select the campaign list to use.',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Connect your account first',
          };
        }

        const campaigns = await listGetResponseCampaigns({
          auth: auth as GetResponseAuthValue,
        });

        if (campaigns.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No campaigns found. Create one in GetResponse first.',
          };
        }

        return {
          disabled: false,
          options: campaigns.map((campaign) => ({
            label: campaign.name ?? campaign.campaignId,
            value: campaign.campaignId,
          })),
        };
      },
    }),
  fromField: (required = true, displayName = 'From Address') =>
    Property.Dropdown({
      auth: getresponseAuth,
      displayName,
      description: 'Select the verified sender address to use.',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Connect your account first',
          };
        }

        const fromFields = await listGetResponseFromFields(auth as GetResponseAuthValue);

        if (fromFields.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No active sender addresses found in GetResponse.',
          };
        }

        return {
          disabled: false,
          options: fromFields.map((fromField) => ({
            label: fromField.name
              ? `${fromField.name} (${fromField.email})`
              : fromField.email,
            value: fromField.fromFieldId,
          })),
        };
      },
    }),
};
