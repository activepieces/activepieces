import { createAction } from '@activepieces/pieces-framework';
import { netlifyAuth } from '../common/auth';
import { netlifyOperations } from '../common/operations';
import { netlifySchemas } from '../common/output-schemas';
import { netlifyProps } from '../common/props';

export const lockDeploy = createAction({
  auth: netlifyAuth,
  name: 'lock_deploy',
  classification: 'WRITE',
  displayName: 'Lock Deploy',
  description: 'Lock a published deploy so new builds do not replace it (stops auto publishing).',
  audience: 'both',
  aiMetadata: {
    description:
      'Locks one Netlify deploy: the site keeps serving it and stops auto-publishing new production builds until Unlock Deploy is run. Use it to freeze the live version. Locking an already locked deploy changes nothing.',
    idempotent: true,
  },
  outputSchema: netlifySchemas.deploy,
  props: { deployId: netlifyProps.deployId({ description: 'The ID of the deploy to lock, usually the one currently published.' }) },
  async run({ auth, propsValue }) {
    return netlifyOperations.setDeployLock({ auth, deployId: propsValue.deployId, locked: true });
  },
});

export const unlockDeploy = createAction({
  auth: netlifyAuth,
  name: 'unlock_deploy',
  classification: 'WRITE',
  displayName: 'Unlock Deploy',
  description: 'Unlock a deploy so new builds are published automatically again.',
  audience: 'both',
  aiMetadata: {
    description:
      'Unlocks one Netlify deploy so the site auto-publishes new production builds again (the next successful build goes live). Unlocking a deploy that is not locked changes nothing.',
    idempotent: true,
  },
  outputSchema: netlifySchemas.deploy,
  props: { deployId: netlifyProps.deployId({ description: 'The ID of the locked deploy.' }) },
  async run({ auth, propsValue }) {
    return netlifyOperations.setDeployLock({ auth, deployId: propsValue.deployId, locked: false });
  },
});
