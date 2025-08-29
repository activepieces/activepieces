import { createAction, Property } from '@activepieces/pieces-framework';
import { netlifyAuth } from '../common/auth';
import { NetlifyClient } from '../common/client';
import { siteIdProperty, validateRequiredFields, formatDeployStatus, formatDeployContext } from '../common/utils';

export const listSiteDeploysAction = createAction({
  auth: netlifyAuth,
  name: 'list_site_deploys',
  displayName: 'List Site Deploys',
  description: 'Get a list of deployments for a Netlify site',
  props: {
    siteId: siteIdProperty,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of deployments to return (default: 10, max: 100)',
      required: false,
      defaultValue: 10
    }),
    state: Property.StaticDropdown({
      displayName: 'Deploy State',
      description: 'Filter deployments by state',
      required: false,
      options: {
        options: [
          { label: 'All States', value: '' },
          { label: 'New', value: 'new' },
          { label: 'Building', value: 'building' },
          { label: 'Uploading', value: 'uploading' },
          { label: 'Processing', value: 'processing' },
          { label: 'Ready', value: 'ready' },
          { label: 'Error', value: 'error' },
          { label: 'Stopped', value: 'stopped' }
        ]
      }
    }),
    context: Property.StaticDropdown({
      displayName: 'Deploy Context',
      description: 'Filter deployments by context',
      required: false,
      options: {
        options: [
          { label: 'All Contexts', value: '' },
          { label: 'Production', value: 'production' },
          { label: 'Deploy Preview', value: 'deploy-preview' },
          { label: 'Branch Deploy', value: 'branch-deploy' }
        ]
      }
    })
  },
  async run(context) {
    const { siteId, limit, state, context: deployContext } = context.propsValue;
    const client = new NetlifyClient(context.auth);

    try {
      // Validate inputs
      validateRequiredFields({ siteId }, ['siteId']);

      // Build query parameters
      const query: any = {
        per_page: Math.min(limit || 10, 100)
      };

      if (state && state.trim() !== '') {
        query.state = state;
      }

      if (deployContext && deployContext.trim() !== '') {
        query.context = deployContext;
      }

      // Get deployments
      const deploys = await client.getDeploys(siteId, query);

      // Format the response
      const formattedDeploys = deploys.map((deploy: any) => ({
        id: deploy.id,
        url: deploy.deploy_url,
        sslUrl: deploy.ssl_url,
        adminUrl: deploy.admin_url,
        status: formatDeployStatus(deploy.state),
        context: formatDeployContext(deploy.context),
        branch: deploy.branch,
        commitRef: deploy.commit_ref,
        commitUrl: deploy.commit_url,
        title: deploy.title,
        createdAt: deploy.created_at,
        updatedAt: deploy.updated_at,
        publishedAt: deploy.published_at,
        errorMessage: deploy.error_message,
        reviewId: deploy.review_id,
        reviewUrl: deploy.review_url,
        framework: deploy.framework,
        functionSchedules: deploy.function_schedules || []
      }));

      return {
        success: true,
        deploys: formattedDeploys,
        total: formattedDeploys.length,
        siteId,
        filters: {
          state: state || 'all',
          context: deployContext || 'all',
          limit: query.per_page
        },
        message: `Retrieved ${formattedDeploys.length} deployment(s) successfully`
      };

    } catch (error: any) {
      throw new Error(`Failed to list site deployments: ${error.message}`);
    }
  }
});
