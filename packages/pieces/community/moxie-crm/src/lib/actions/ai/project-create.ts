import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../../auth';
import { credentialsOf } from '../../common';
import { moxieFields } from '../../common/fields';
import { moxieOperations } from '../../common/operations';
import { moxieProps } from '../../common/props';
import { moxieActionOutputSchemas } from '../../output-schemas';

export const moxieProjectCreateAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_project_create',
  classification: 'WRITE',
  displayName: 'Create Project',
  description: 'Creates a project for an existing Moxie client.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a project under an existing client matched by exact name, with optional dates, portal access, template and fee schedule (the fee schedule is sent only when Fee Type is set). Use when starting a new engagement for a known client. Not idempotent: each call creates a separate project.',
    idempotent: false,
  },
  outputSchema: moxieActionOutputSchemas.project,
  props: {
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'Name of the new project.',
      required: true,
    }),
    clientName: Property.ShortText({
      displayName: 'Client Name',
      description: 'Exact name of an existing client, from Search Clients.',
      required: true,
    }),
    ...moxieProps.fromSpecs({ specs: moxieFields.projectCreate, audience: 'ai' }),
    ...moxieProps.fromSpecs({ specs: moxieFields.projectFee, audience: 'ai' }),
  },
  async run({ auth, propsValue }) {
    return moxieOperations.createProject({ credentials: credentialsOf({ auth }), values: propsValue });
  },
});
