import { createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieDropdowns } from '../common/dropdowns';
import { moxieFields } from '../common/fields';
import { moxieOperations } from '../common/operations';
import { moxieProps } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieUpdateProjectAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_update_project',
  classification: 'WRITE',
  displayName: 'Update Project',
  description: 'Update details of an existing project. Empty fields keep their current value.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates fields on a Moxie project picked by client and project; only filled fields change. For agents use moxie_project_update. Idempotent.',
    idempotent: true,
  },
  outputSchema: moxieActionOutputSchemas.project,
  props: {
    clientName: moxieDropdowns.clientName({ required: true }),
    projectId: moxieDropdowns.projectByClientName({ required: true, valueKey: 'id' }),
    ...moxieProps.fromSpecs({ specs: moxieFields.projectUpdate, audience: 'human' }),
    clearFields: moxieProps.clearFields({ specs: moxieFields.projectUpdate }),
  },
  async run({ auth, propsValue }) {
    return moxieOperations.updateProject({ credentials: credentialsOf({ auth }), values: propsValue });
  },
});
