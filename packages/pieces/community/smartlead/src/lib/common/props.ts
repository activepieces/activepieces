import { Property } from '@activepieces/pieces-framework';
import { smartleadAuth } from '../auth';
import { smartleadOperations } from './operations';

function campaignDropdown({ description }: { description: string }) {
  return Property.Dropdown<number, true, typeof smartleadAuth>({
    auth: smartleadAuth,
    displayName: 'Campaign',
    description,
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your SmartLead account first.' };
      }
      try {
        const options = await smartleadOperations.listCampaignOptions({ apiKey: auth.secret_text });
        return {
          disabled: false,
          options,
          placeholder: options.length === 0 ? 'No campaigns found.' : undefined,
        };
      } catch {
        return { disabled: true, options: [], placeholder: 'Could not load campaigns. Check the connection.' };
      }
    },
  });
}

function triStateDropdown({ displayName, description }: { displayName: string; description: string }) {
  return Property.StaticDropdown<boolean, false>({
    displayName,
    description: `${description} Leave empty to keep the current value.`,
    required: false,
    options: {
      options: [
        { label: 'On', value: true },
        { label: 'Off', value: false },
      ],
    },
  });
}

export const smartleadProps = { campaignDropdown, triStateDropdown };
