import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { encodeSegment, gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, requireText } from '../../common/props';
import { deletedLabelOutputSchema } from '../../output-schemas-admin';

export const deleteLabelAction = createAction({
  auth: gitlabAuth,
  name: 'delete_label',
  displayName: 'Delete Label',
  description: 'Permanently deletes a project label.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes a GitLab project label and removes it from every issue and merge request that has it; it cannot be restored. A second call fails with not found. Group labels cannot be deleted here.',
    idempotent: false,
  },
  props: {
    projectId: gitlabProps.projectId(),
    labelId: adminProps.labelId(),
  },
  outputSchema: deletedLabelOutputSchema,
  async run({ auth, propsValue }) {
    const label = requireText({ value: propsValue.labelId, label: 'Label ID or Name' });
    await gitlabRequest({ auth,  method: 'DELETE', path: `${projectPath(propsValue.projectId)}/labels/${encodeSegment({ value: label, label: 'Label ID or Name' })}` });
    return { deleted: true, label };
  },
});
