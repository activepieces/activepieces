import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tenzoApiCall } from './client';
import { TenzoAuthValue } from './auth';
import { tenzoAuth } from "../common/auth";

export const tenzoCommon = {
  location_id: (required = true) =>
    Property.Dropdown({
      displayName: 'Location',
      description: 'Select the location to filter data',
      required,
      refreshers: [],
      auth: tenzoAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };
        }

        try {
          const response = await tenzoApiCall<{
            count: number;
            next: string | null;
            previous: string | null;
            results: Array<{
              id: number;
              name: string;
            }>;
          }>({
            method: HttpMethod.GET,
            path: '/locations/',
            auth: auth as TenzoAuthValue,
          });

          return {
            options: response.results.map((location) => ({
              label: location.name,
              value: location.id.toString(),
            })),
          };
        } catch (error) {
          console.error('Failed to fetch locations:', error);
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load locations',
          };
        }
      },
    }),

  area_id: (required = true) =>
    Property.Dropdown({
      displayName: 'Area',
      description: 'Select the area to filter data',
      required,
      refreshers: [],
      auth: tenzoAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };
        }

        try {
          const response = await tenzoApiCall<{
            count: number;
            next: string | null;
            previous: string | null;
            results: Array<{
              id: number;
              name: string;
            }>;
          }>({
            method: HttpMethod.GET,
            path: '/areas/',
            auth: auth as TenzoAuthValue,
          });

          return {
            options: response.results.map((area) => ({
              label: area.name,
              value: area.id.toString(),
            })),
          };
        } catch (error) {
          console.error('Failed to fetch areas:', error);
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load areas',
          };
        }
      },
    }),
};
