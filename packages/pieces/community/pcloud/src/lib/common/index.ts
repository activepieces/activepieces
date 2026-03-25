import { Property } from '@activepieces/pieces-framework';

export const pcloudCommon = {
  baseUrl: 'https://api.pcloud.com',
  eBaseUrl: 'https://eapi.pcloud.com',

  folderIdProp: Property.Number({
    displayName: 'Folder ID',
    description: 'The ID of the folder. Use 0 for root folder.',
    required: true,
    defaultValue: 0,
  }),

  getApiUrl(locationId?: number): string {
    return locationId === 2 ? this.eBaseUrl : this.baseUrl;
  },
};
