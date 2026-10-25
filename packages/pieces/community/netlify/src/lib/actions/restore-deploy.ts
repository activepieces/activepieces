import { createAction } from '@activepieces/pieces-framework';
import { netlifyAuth } from '../common/auth';
import { netlifyOperations } from '../common/operations';
import { netlifySchemas } from '../common/output-schemas';
import { netlifyProps } from '../common/props';

export const restoreDeploy = createAction({
  auth: netlifyAuth,
  name: 'restore_deploy',
  classification: 'WRITE',
  displayName: 'Publish Deploy (Rollback)',
  description: 'Publish an earlier deploy so it becomes the live version of its site.',
  audience: 'both',
  aiMetadata: {
    description:
      'Publishes an existing, successfully built Netlify deploy as the live production version of its site, e.g. to roll back to an earlier deploy after a bad release. The site is looked up from the deploy. Publishing the deploy that is already live changes nothing; to undo, publish the previous deploy again. Returns the published deploy.',
    idempotent: true,
  },
  outputSchema: netlifySchemas.deploy,
  props: { deployId: netlifyProps.deployId({ description: 'The ID of the deploy to publish (from List Site Deploys).' }) },
  async run({ auth, propsValue }) {
    return netlifyOperations.restoreDeploy({ auth, deployId: propsValue.deployId });
  },
});
