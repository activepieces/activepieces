import { createAction, Property } from '@activepieces/pieces-framework';
import { netlifyAuth } from '../common/auth';
import { NetlifyClient } from '../common/client';
import { siteIdProperty, validateRequiredFields, formatDeployStatus } from '../common/utils';

export const startDeployAction = createAction({
  auth: netlifyAuth,
  name: 'start_deploy',
  displayName: 'Start Deploy',
  description: 'Trigger a new deployment for a Netlify site',
  props: {
    siteId: siteIdProperty,
    clearCache: Property.Checkbox({
      displayName: 'Clear Cache',
      description: 'Clear the build cache before deploying',
      required: false,
      defaultValue: false
    })
  },
  async run(context) {
    const { siteId, clearCache } = context.propsValue;
    const client = new NetlifyClient(context.auth);

    try {
      // Validate inputs
      validateRequiredFields({ siteId }, ['siteId']);

      // Get site information first to verify it exists
      const site = await client.getSite(siteId);

      // Start the deployment
      const deployData: any = {};
      
      if (clearCache) {
        deployData.clear_cache = true;
      }

      const deploy = await client.startDeploy(siteId);

      return {
        success: true,
        deploy: {
          id: deploy.id,
          url: deploy.deploy_url,
          adminUrl: deploy.admin_url,
          status: formatDeployStatus(deploy.state),
          createdAt: deploy.created_at,
          branch: deploy.branch,
          commitRef: deploy.commit_ref,
          commitUrl: deploy.commit_url,
          context: deploy.context,
          reviewId: deploy.review_id,
          reviewUrl: deploy.review_url
        },
        site: {
          id: site.id,
          name: site.name,
          url: site.url,
          adminUrl: site.admin_url
        },
        message: 'Deployment started successfully'
      };

    } catch (error: any) {
      throw new Error(`Failed to start deployment: ${error.message}`);
    }
  }
});
