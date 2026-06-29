import { createAction } from '@activepieces/pieces-framework';
import { airtableAuth } from '../auth';
import { airtableCommon } from '../common';

export const airtableListBasesAction = createAction({
  auth: airtableAuth,
  name: 'list_bases',
  displayName: 'List Bases (Agent)',
  description: 'List all Airtable bases the token can access.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns every base the connected token can access, each with its id, name and permission level — the top resolver for turning a base name into a base ID. Call this first, then Get Base Schema (Agent) to discover tables and fields. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const { auth } = context;

    const bases = await airtableCommon.fetchAllBases({
      token: auth.secret_text,
    });

    return {
      bases: bases.map((base) => ({
        id: base.id,
        name: base.name,
        permissionLevel: base.permissionLevel,
      })),
      count: bases.length,
    };
  },
});
