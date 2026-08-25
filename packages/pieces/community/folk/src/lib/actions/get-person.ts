import { createAction } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';
import { folkProps } from '../common/props';

export const getPerson = createAction({
  auth: folkAuth,
  name: 'getPerson',
  displayName: 'Get Person',
  description: 'Retrieve detailed information about a person from your Folk workspace.',
  audience: 'both',
  aiMetadata: {
    description: 'Fetches the full record of a single Folk person (contact) by their person ID. Use when you already have the person ID and need their current details; if you only have a name or email, find the ID first with List People. Read-only and idempotent.',
    idempotent: true,
  },
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

