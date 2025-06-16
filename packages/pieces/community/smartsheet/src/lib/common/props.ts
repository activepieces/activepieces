import {
  Property,
  DropdownOption,
  InputPropertyMap,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsheetApiCall } from './client';

interface Sheet {
  id: number;
  name: string;
}

interface Column {
  id: number;
  title: string;
}

export const sheetDropdown = (required = false) =>
  Property.Dropdown({
    displayName: 'Sheet',
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your Smartsheet account',
          options: [],
        };
      }

      const { apiKey, region } = auth as { apiKey: string; region: string };
      const allowedRegions = ['default', 'gov', 'eu', 'au'] as const;
      type AllowedRegion = typeof allowedRegions[number];
      function isAllowedRegion(value: string): value is AllowedRegion {
        return allowedRegions.includes(value as AllowedRegion);
      }
      const safeRegion = isAllowedRegion(region) ? region : undefined;

      const response = await smartsheetApiCall<{ data: Sheet[] }>({
        apiKey,
        region: safeRegion,
        method: HttpMethod.GET,
        resourceUri: '/sheets',
      });

      const options: DropdownOption<number>[] = response.data.map((sheet) => ({
        label: sheet.name,
        value: sheet.id,
      }));

      return {
        disabled: false,
        options,
      };
    },
  });

export const findSheetByNameDropdown = (required = false) =>
  Property.Dropdown({
    displayName: 'Find Sheet by Name',
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your Smartsheet account',
          options: [],
        };
      }

      const { apiKey, region } = auth as { apiKey: string; region: string };
      const allowedRegions = ['default', 'gov', 'eu', 'au'] as const;
      type AllowedRegion = typeof allowedRegions[number];
      function isAllowedRegion(value: string): value is AllowedRegion {
        return allowedRegions.includes(value as AllowedRegion);
      }
      const safeRegion = isAllowedRegion(region) ? region : undefined;

      const response = await smartsheetApiCall<{ data: Sheet[] }>({
        apiKey,
        region: safeRegion,
        method: HttpMethod.GET,
        resourceUri: '/sheets',
      });

      const options: DropdownOption<number>[] = response.data.map((sheet) => ({
        label: sheet.name,
        value: sheet.id,
      }));

      return {
        disabled: false,
        options,
      };
    },
  });

export const columnDropdown = (required = false) =>
  Property.DynamicProperties({
    displayName: 'Cells',
    required,
    refreshers: ['sheetId'],
    props: async ({ auth, sheetId }): Promise<InputPropertyMap> => {
      if (!auth || !sheetId) return {};

      const { apiKey, region } = auth as { apiKey: string; region: string };
      const allowedRegions = ['default', 'gov', 'eu', 'au'] as const;
      type AllowedRegion = typeof allowedRegions[number];
      function isAllowedRegion(value: string): value is AllowedRegion {
        return allowedRegions.includes(value as AllowedRegion);
      }
      const safeRegion = isAllowedRegion(region) ? region : undefined;

      const response = await smartsheetApiCall<{ data: Column[] }>({
        apiKey,
        region: safeRegion,
        method: HttpMethod.GET,
        resourceUri: `/sheets/${sheetId}/columns`,
      });

      const props: InputPropertyMap = {};

      for (const col of response.data) {
        props[col.id.toString()] = Property.ShortText({
          displayName: col.title,
          required: required,
          description: `Column ID: ${col.id}`,
        });
      }

      return props;
    },
  });
