import { HttpMethod } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { weekdoneAuth } from '../../auth';
import { weekdoneApiCall } from '../../common';

export const getCompanyInfoAction = createAction({
  auth: weekdoneAuth,
  name: 'get_company_info',
  displayName: 'Get Company Info',
  description: 'Get company configuration and settings.',
  audience: 'both',
  aiMetadata: { description: 'Retrieve the authenticated account\'s Weekdone company configuration and settings. Takes no input. Read-only and idempotent.', idempotent: true },
  props: {},
  async run({ auth }) {
    return weekdoneApiCall({
      auth: auth as OAuth2PropertyValue,
      method: HttpMethod.GET,
      path: '/company',
    });
  },
});
