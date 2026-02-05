import entryActions from './entry';
import customerActions from './customer';
import projectActions from './project';
import serviceActions from './service';
import teamActions from './team';
import userActions from './user';
import absenceActions from './absence';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { clockodoAuth } from '../../index';

export default [
  ...entryActions,
  ...customerActions,
  ...projectActions,
  ...serviceActions,
  ...teamActions,
  ...userActions,
  ...absenceActions,
  createCustomApiCallAction({
    baseUrl: () => 'https://my.clockodo.com/api', // Replace with the actual base URL
    auth: clockodoAuth,
    authMapping: async (auth) => ({
      'X-ClockodoApiUser': auth?.props?.email || '',
      'X-ClockodoApiKey': auth?.props?.token || '',
      'X-Clockodo-External-Application': auth?.props?.company_name || '',
      'Accept-Language': 'en',
    }),
  }),
];
