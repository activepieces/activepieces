import { createAction } from '@activepieces/pieces-framework';
import { smartsheetApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsheetAuth } from '../../index';
import { findSheetByNameDropdown } from '../common/props';

export const findSheetByName = createAction({
  auth: smartsheetAuth,
  name: 'find_sheet_by_name',
  displayName: 'Find Sheet by Name',
  description: 'Access project sheets dynamically based on naming conventions.',
  props: {
    sheetId: findSheetByNameDropdown(true),
  },
  async run(context) {
    const sheetId = context.propsValue;
    const { apiKey, region } = context.auth;

    const sheet = await smartsheetApiCall({
      apiKey,
      region: region as 'default' | 'gov' | 'eu' | 'au' | undefined,
      method: HttpMethod.GET,
      resourceUri: `/sheets/${sheetId}`,
    });

    return sheet;
  },
});
