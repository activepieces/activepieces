import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps, groupPath } from '../../common/admin';
import { gitlabRequest } from '../../common/client';
import { groupOutputSchema } from '../../output-schemas-admin';

export const getGroupAction = createAction({
  auth: gitlabAuth,
  name: 'get_group',
  displayName: 'Get Group',
  description: 'Gets one group by ID or full path.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns one GitLab group by numeric ID or full path: name, numeric ID, full path, visibility, parent group and URL. Use it to turn a group path into the numeric ID other actions need. Use List Group Projects for its projects.',
    idempotent: true,
  },
  props: {
    groupId: adminProps.groupId(),
  },
  outputSchema: groupOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabRequest({ auth,  method: 'GET', path: groupPath(propsValue.groupId), query: { with_projects: false } });
  },
});
