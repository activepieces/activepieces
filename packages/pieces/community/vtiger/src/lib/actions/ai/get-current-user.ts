import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../../auth';
import { currentUserSchema } from '../../output-schemas';
import { vtigerRest } from '../../rest-client';

export const getCurrentUserAction = createAction({
  auth: vtigerAuth,
  name: 'get_current_user',
  displayName: 'Get Current User',
  description: 'Returns the Vtiger user the connection authenticates as.',
  classification: 'READ',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the profile of the connected Vtiger user (webservice user ID, name, email, role, time zone, date format). Use it to get your own user ID for assigned_user_id fields or to read the user time zone before interpreting record timestamps.',
    idempotent: true,
  },
  outputSchema: currentUserSchema,
  props: {},
  async run({ auth }) {
    return vtigerRest<Record<string, unknown>>({ creds: auth.props, method: HttpMethod.GET, path: 'me' });
  },
});
