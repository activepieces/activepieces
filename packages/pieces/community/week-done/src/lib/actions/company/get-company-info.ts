import { HttpMethod } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { weekdoneAuth } from '../../../index';
import { weekdoneApiCall } from '../../common';

export const getCompanyInfoAction = createAction({
  auth: weekdoneAuth,
  name: 'get_company_info',
  displayName: 'Get Company Info',
  description: 'Get company configuration and settings.',
  props: {},
  async run({ auth }) {
    return weekdoneApiCall({
      auth: auth as OAuth2PropertyValue,
      method: HttpMethod.GET,
      path: '/company',
    });
  },
});
