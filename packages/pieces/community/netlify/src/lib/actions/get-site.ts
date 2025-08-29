import { createAction, Property } from '@activepieces/pieces-framework';
import { netlifyAuth } from '../common/auth';
import { NetlifyClient } from '../common/client';
import { siteIdProperty, validateRequiredFields } from '../common/utils';

export const getSiteAction = createAction({
  auth: netlifyAuth,
  name: 'get_site',
  displayName: 'Get Site',
  description: 'Retrieve information about a specific Netlify site',
  props: {
    siteId: siteIdProperty
  },
  async run(context) {
    const { siteId } = context.propsValue;
    const client = new NetlifyClient(context.auth);

    try {
      // Validate inputs
      validateRequiredFields({ siteId }, ['siteId']);

      // Get site information
      const site = await client.getSite(siteId);

      return {
        success: true,
        site: {
          id: site.id,
          name: site.name,
          customDomain: site.custom_domain,
          url: site.url,
          sslUrl: site.ssl_url,
          adminUrl: site.admin_url,
          screenshotUrl: site.screenshot_url,
          createdAt: site.created_at,
          updatedAt: site.updated_at,
          userId: site.user_id,
          state: site.state,
          plan: site.plan,
          accountName: site.account_name,
          accountSlug: site.account_slug,
          gitProvider: site.build_settings?.provider,
          repoUrl: site.build_settings?.repo_url,
          repoBranch: site.build_settings?.repo_branch,
          buildCommand: site.build_settings?.cmd,
          publishDir: site.build_settings?.dir,
          environmentVariables: site.build_settings?.env || {},
          deployHook: site.deploy_hook,
          managedDns: site.managed_dns,
          processingSettings: site.processing_settings,
          buildSettings: site.build_settings,
          deployUrl: site.deploy_url,
          published: site.published_deploy ? {
            id: site.published_deploy.id,
            url: site.published_deploy.deploy_url,
            sslUrl: site.published_deploy.ssl_url,
            adminUrl: site.published_deploy.admin_url,
            createdAt: site.published_deploy.created_at,
            updatedAt: site.published_deploy.updated_at,
            state: site.published_deploy.state,
            context: site.published_deploy.context,
            branch: site.published_deploy.branch,
            commitRef: site.published_deploy.commit_ref,
            commitUrl: site.published_deploy.commit_url,
            reviewId: site.published_deploy.review_id,
            reviewUrl: site.published_deploy.review_url
          } : null
        },
        message: 'Site information retrieved successfully'
      };

    } catch (error: any) {
      throw new Error(`Failed to get site information: ${error.message}`);
    }
  }
});
