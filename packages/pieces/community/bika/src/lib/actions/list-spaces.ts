import { createAction } from '@activepieces/pieces-framework';
import { BikaAuth } from '../auth';
import { bikaOperations } from '../common/operations';
import { bikaOutputSchemas } from '../output-schemas';

export const listSpacesAction = createAction({
  auth: BikaAuth,
  name: 'list_spaces',
  classification: 'SEARCH',
  displayName: 'List Spaces',
  description: 'Lists the Bika spaces this account belongs to.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the Bika.ai spaces the connected token can reach, with each space ID, name and plan. Start here to get the space ID that List Databases and every record action need. Read-only; costs one API request.',
    idempotent: true,
  },
  props: {},
  outputSchema: bikaOutputSchemas.spaces,
  async run(context) {
    return bikaOperations.listSpaces({ auth: context.auth });
  },
});
