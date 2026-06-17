import { Property } from '@activepieces/pieces-framework';
import { lemlistApiService } from './requests';
import { lemlistAuth } from './constants';

export const campaignsDropdown = ({
  refreshers,
  required = true,
}: {
  refreshers: string[];
  required?: boolean;
}) =>
  Property.Dropdown({
    auth: lemlistAuth,
    displayName: 'Campaign',
    description: required
      ? 'Select a campaign'
      : 'Select a campaign (optional)',
    required,
    refreshers,
    async options({ auth }) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Lemlist account first',
          options: [],
        };
      }

      try {
        const campaigns = await lemlistApiService.fetchCampaigns(auth.secret_text);

        return {
          options: campaigns.map((c: any) => ({
            label: c.name,
            value: c._id,
          })),
        };
      } catch (e) {
        console.error('Failed to fetch campaigns', e);
        return {
          options: [],
          placeholder: 'Unable to load campaigns',
        };
      }
    },
  });
