import { Property } from '@activepieces/pieces-framework';
import { seekTableApiCall } from './client';
import { HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { seekTableAuth } from './auth';

interface Cube {
  Id: string;
  Name: string;
  SourceType: string;
  SourceTypeId: string;
  SourceFile?: string;
  CreateDate: string;
}

export const seekTableProps = {
  cubeId: Property.Dropdown({
    displayName: 'Existing Cube (Optional)',
    description: 'Select an existing CSV cube to refresh, or leave empty to create a new cube',
    required: false,
    refreshers: ['auth'],
    auth: seekTableAuth,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please authenticate first',
        };
      }

      try {
        const response = await seekTableApiCall({
          auth: (auth as any).secret_text,
          method: HttpMethod.GET,
          resourceUri: 'api/cube',
        }) as Cube[];

        // Filter only CSV cubes for refresh
        const csvCubes = response.filter(cube => cube.SourceTypeId === 'file-csv');

        return {
          options: csvCubes.map(cube => ({
            label: cube.Name,
            value: cube.Id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading cubes',
        };
      }
    },
  }),
  filename: Property.ShortText({
    displayName: 'Filename (Optional)',
    description: 'Custom filename for the uploaded CSV. Include .gz or .zip extension if the file is compressed.',
    required: false,
  }),
  csvFile: Property.File({
    displayName: 'CSV File',
    description: 'The CSV file to upload. Can be plain CSV or compressed (.gz, .zip)',
    required: true,
  }),
};
