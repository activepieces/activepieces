import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { carboneAuth } from '../auth';
import { CARBONE_API_URL, CARBONE_VERSION } from './constants';

function templateDropdown({
  displayName,
  description,
  showIdInLabel = true,
}: {
  displayName: string;
  description: string;
  showIdInLabel?: boolean;
}) {
  return Property.Dropdown({
    auth: carboneAuth,
    displayName,
    required: true,
    description,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, placeholder: 'Connect your account first', options: [] };
      }
      try {
        const response = await httpClient.sendRequest<{
          success: boolean;
          data: Array<{ id: string; versionId: string; name: string; category: string }>;
        }>({
          method: HttpMethod.GET,
          url: `${CARBONE_API_URL}/templates`,
          headers: {
            Authorization: `Bearer ${auth}`,
            'carbone-version': CARBONE_VERSION,
          },
          queryParams: { limit: '100' },
        });
        if (!response.body.success) {
          return { disabled: false, placeholder: 'Failed to fetch templates', options: [] };
        }
        return {
          disabled: false,
          options: response.body.data.map((template) => ({
            label: showIdInLabel
              ? `${template.name || template.id} (${template.id})`
              : template.name || template.id,
            value: template.id,
          })),
        };
      } catch {
        return { disabled: false, placeholder: 'Error loading templates', options: [] };
      }
    },
  });
}

export const carboneProps = {
  templateDropdown,
};
