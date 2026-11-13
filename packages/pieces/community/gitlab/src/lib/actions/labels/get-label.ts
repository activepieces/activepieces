import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { encodeSegment, gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, triStateValue } from '../../common/props';
import { labelOutputSchema } from '../../output-schemas-admin';

export const getLabelAction = createAction({
  auth: gitlabAuth,
  name: 'get_label',
  displayName: 'Get Label',
  description: 'Gets one project label by ID or name.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns one GitLab project label by numeric ID or exact name: color, description, priority and whether it is a project or group label. Group labels are found when Include Group Labels is yes.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    labelId: adminProps.labelId(),
    includeAncestorGroups: gitlabProps.triState('Include Group Labels', 'Also look in labels inherited from parent groups.'),
  },
  outputSchema: labelOutputSchema,
  async run({ auth, propsValue }) {
    return gitlabRequest({ auth, 
      method: 'GET',
      path: `${projectPath(propsValue.projectId)}/labels/${encodeSegment({ value: propsValue.labelId, label: 'Label ID or Name' })}`,
      query: { include_ancestor_groups: triStateValue(propsValue.includeAncestorGroups) },
    });
  },
});
