import { Property } from '@activepieces/pieces-framework';
import { tryCatch } from '@activepieces/shared';

import { glideAuth } from '../auth';
import { listGlideTables } from './client';

export const glideProps = {
  tableId: (required = true) =>
    Property.Dropdown({
      auth: glideAuth,
      displayName: 'Table',
      description: 'Select the Glide Big Table to use.',
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

        const { data: tables, error } = await tryCatch(() => listGlideTables(auth));

        if (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load Glide tables. Check your connection.',
          };
        }

        if (tables.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No Glide Big Tables found for this token.',
          };
        }

        return {
          disabled: false,
          options: tables.map((table) => ({
            label: table.name,
            value: table.id,
          })),
        };
      },
    }),
};
