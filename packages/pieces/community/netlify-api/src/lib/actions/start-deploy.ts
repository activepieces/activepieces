import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const startDeploy = createAction({
  name: 'start_deploy',
  displayName: 'Start Deploy',
  description:
    'Triggers a new build for a site on Netlify. Supports clearing build cache.',
  props: {
    site_id: Property.ShortText({
      displayName: 'Site ID',
      description: 'The unique identifier of the Netlify site',
      required: true
    }),
    title: Property.ShortText({
      displayName: 'Deploy Title',
      description: 'Optional title for the deployment',
      required: false
    }),
    branch: Property.ShortText({
      displayName: 'Branch',
      description: 'Git branch to deploy from',
      required: false
    }),
    draft: Property.Checkbox({
      displayName: 'Draft Deploy',
      description: 'Create a draft deployment (not published)',
      required: false,
      defaultValue: false
    }),
    async: Property.Checkbox({
      displayName: 'Async Deploy',
      description: 'Start deployment asynchronously',
      required: false,
      defaultValue: true
    }),
    clear_cache: Property.Checkbox({
      displayName: 'Clear Build Cache',
      description: 'Clear the build cache before deploying',
      required: false,
      defaultValue: false
    }),
    framework: Property.StaticDropdown({
      displayName: 'Framework',
      description: 'Framework used for the site',
      required: false,
      options: {
        options: [
          { label: 'React', value: 'react' },
          { label: 'Vue', value: 'vue' },
          { label: 'Angular', value: 'angular' },
          { label: 'Gatsby', value: 'gatsby' },
          { label: 'Next.js', value: 'nextjs' },
          { label: 'Nuxt.js', value: 'nuxtjs' },
          { label: 'Svelte', value: 'svelte' },
          { label: 'SvelteKit', value: 'sveltekit' },
          { label: 'Astro', value: 'astro' },
          { label: 'Hugo', value: 'hugo' },
          { label: 'Jekyll', value: 'jekyll' },
          { label: 'Eleventy', value: '11ty' },
          { label: 'Vite', value: 'vite' },
          { label: 'Create React App', value: 'create-react-app' },
          { label: 'Static HTML', value: 'static' },
          { label: 'Other', value: 'other' }
        ]
      }
    }),
    framework_version: Property.ShortText({
      displayName: 'Framework Version',
      description: 'Version of the framework',
      required: false
    })
  },
  async run(context) {
    const { auth, propsValue } = context;

    const requestBody: any = {
      async: propsValue.async,
      draft: propsValue.draft
    };

    // Add optional fields if provided
    if (propsValue.title) {
      requestBody.title = propsValue.title;
    }
    if (propsValue.branch) {
      requestBody.branch = propsValue.branch;
    }
    if (propsValue.framework) {
      requestBody.framework = propsValue.framework;
    }
    if (propsValue.framework_version) {
      requestBody.framework_version = propsValue.framework_version;
    }

    // Build query parameters
    const queryParams = new URLSearchParams();

    if (propsValue.clear_cache) {
      queryParams.append('clear_cache', 'true');
    }

    const queryString = queryParams.toString();
    const url = `https://api.netlify.com/api/v1/sites/${
      propsValue.site_id
    }/deploys${queryString ? `?${queryString}` : ''}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: url,
      headers: {
        Authorization: `Bearer ${(auth as any).access_token}`,
        'Content-Type': 'application/json'
      },
      body: requestBody
    });

    return response.body;
  }
});
