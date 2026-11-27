import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxClient } from '../../../common/client';

export const listClassificationsAction = createAction({
  auth: boxAuth,
  name: 'box_list_classifications',
  displayName: 'List Classifications',
  description: 'Lists the security classification labels of the Box enterprise.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns the enterprise\'s classification template; fields[0].options holds every classification label (its key, definition and color). Those keys are what Add File Classification and Add Folder Classification take. Needs an admin; fails with 404 when the enterprise has none yet: use Create Classification Template then.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/metadata_templates/enterprise/securityClassification-6VMVochwUWo/schema',
    });
  },
});
