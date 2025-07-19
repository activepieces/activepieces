import { makeClient } from '../../common';
import { clockodoAuth } from '../../../';
import { createAction } from '@ensemble/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'list_services',
  displayName: 'Get Services',
  description: 'Fetches services from clockodo',
  props: {},
  async run({ auth }) {
    const client = makeClient(auth);
    const res = await client.listServices();
    return {
      services: res.services,
    };
  },
});
