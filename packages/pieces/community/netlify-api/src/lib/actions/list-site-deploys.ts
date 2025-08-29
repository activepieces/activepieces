import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const listSiteDeploys = createAction({
  name: 'list_site_deploys',
  displayName: 'List Site Deploys',
  description:
    'Returns a list of all deploys for a specific site with filtering options. Each deploy includes: id, site_id, user_id, build_id, state, name, url, ssl_url, admin_url, deploy_url, deploy_ssl_url, screenshot_url, review_id, draft status, required files/functions, error_message, branch, commit_ref, commit_url, timestamps (created_at, updated_at, published_at), title, context, locked status, review_url, framework, and function_schedules.',
  props: {
    site_id: Property.ShortText({
      displayName: 'Site ID',
      description: 'The unique identifier of the Netlify site',
      required: true
    }),
    state: Property.StaticDropdown({
      displayName: 'Deploy State',
      description: 'Filter deploys by state',
      required: false,
      options: {
        options: [
          { label: 'New', value: 'new' },
          { label: 'Pending Review', value: 'pending_review' },
          { label: 'Accepted', value: 'accepted' },
          { label: 'Rejected', value: 'rejected' },
          { label: 'Enqueued', value: 'enqueued' },
          { label: 'Building', value: 'building' },
          { label: 'Uploading', value: 'uploading' },
          { label: 'Uploaded', value: 'uploaded' },
          { label: 'Preparing', value: 'preparing' },
          { label: 'Prepared', value: 'prepared' },
          { label: 'Processing', value: 'processing' },
          { label: 'Processed', value: 'processed' },
          { label: 'Ready', value: 'ready' },
          { label: 'Error', value: 'error' },
          { label: 'Retrying', value: 'retrying' }
        ]
      }
    }),
    branch: Property.ShortText({
      displayName: 'Branch',
      description: 'Filter deploys by Git branch',
      required: false
    }),
    production: Property.Checkbox({
      displayName: 'Production Only',
      description: 'Show only production deploys',
      required: false
    }),
    deploy_previews: Property.Checkbox({
      displayName: 'Deploy Previews Only',
      description: 'Show only deploy previews',
      required: false
    }),
    latest_published: Property.Checkbox({
      displayName: 'Latest Published Only',
      description: 'Show only the latest published deploy',
      required: false
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination (starts at 1)',
      required: false,
      defaultValue: 1
    }),
    per_page: Property.Number({
      displayName: 'Per Page',
      description: 'Number of deploys per page (max 100)',
      required: false,
      defaultValue: 20
    })
  },
  async run(context) {
    const { auth, propsValue } = context;

    // Build query parameters
    const queryParams = new URLSearchParams();

    if (propsValue.state) {
      queryParams.append('state', propsValue.state);
    }
    if (propsValue.branch) {
      queryParams.append('branch', propsValue.branch);
    }
    if (propsValue.production) {
      queryParams.append('production', 'true');
    }
    if (propsValue.deploy_previews) {
      queryParams.append('deploy-previews', 'true');
    }
    if (propsValue.latest_published) {
      queryParams.append('latest-published', 'true');
    }
    if (propsValue.page) {
      queryParams.append('page', propsValue.page.toString());
    }
    if (propsValue.per_page) {
      queryParams.append('per_page', propsValue.per_page.toString());
    }

    const queryString = queryParams.toString();
    const url = `https://api.netlify.com/api/v1/sites/${
      propsValue.site_id
    }/deploys${queryString ? `?${queryString}` : ''}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: url,
      headers: {
        Authorization: `Bearer ${(auth as any).access_token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.body;
  }
});
