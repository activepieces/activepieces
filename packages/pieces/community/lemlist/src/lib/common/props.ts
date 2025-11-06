import { Property } from '@activepieces/pieces-framework';
import { lemlistApiService } from './requests';

export const campaignsDropdown = ({
  refreshers,
  required = true,
}: {
  refreshers: string[];
  required?: boolean;
}) =>
  Property.Dropdown({
    displayName: 'Campaign',
    description: required
      ? 'Select a campaign'
      : 'Select a campaign (optional)',
    required,
    refreshers,
    async options({ auth }: any) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Lemlist account first',
          options: [],
        };
      }

      try {
        const campaigns = await lemlistApiService.fetchCampaigns(auth);

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
