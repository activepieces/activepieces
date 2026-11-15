import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../../auth';
import { credentialsOf } from '../../common';
import { moxieFields } from '../../common/fields';
import { moxieOperations } from '../../common/operations';
import { moxieProps } from '../../common/props';
import { moxieActionOutputSchemas } from '../../output-schemas';

export const moxieProjectUpdateAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_project_update',
  classification: 'WRITE',
  displayName: 'Update Project',
  description: 'Updates fields on an existing Moxie project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates an existing Moxie project by id (name, description, dates, active state, portal access, colour); only the fields you pass change and Clear Fields blanks the description. Use after finding the project id with Search Projects; the fee schedule is not changed here. Idempotent: repeating the same update leaves the project unchanged.',
    idempotent: true,
  },
  outputSchema: moxieActionOutputSchemas.project,
  props: {
    projectId: Property.ShortText({
      displayName: 'Project ID',
      description: 'Id of the project to update, from Search Projects or a project trigger.',
      required: true,
    }),
    ...moxieProps.fromSpecs({ specs: moxieFields.projectUpdate, audience: 'ai' }),
    clearFields: moxieProps.clearFields({ specs: moxieFields.projectUpdate }),
  },
  async run({ auth, propsValue }) {
    return moxieOperations.updateProject({ credentials: credentialsOf({ auth }), values: propsValue });
  },
});
