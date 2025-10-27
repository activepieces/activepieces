import { createAction } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';
import { folkProps } from '../common/props';

export const getPerson = createAction({
  auth: folkAuth,
  name: 'getPerson',
  displayName: 'Get Person',
  description: 'Retrieve detailed information about a person from your Folk workspace.',
  props: {
    personId: folkProps.person_id(true),
  },
  async run(context) {
    const { personId } = context.propsValue;

    const response = await folkClient.getPerson({
      apiKey: context.auth,
      contactId: personId as string,
    });

    return {
      data: response.data,
      success: true,
    };
  },
});

