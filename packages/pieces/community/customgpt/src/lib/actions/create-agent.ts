import { createAction, Property } from '@activepieces/pieces-framework';
import { customgptAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createAgent = createAction({
  auth: customgptAuth,
  name: 'createAgent',
  displayName: 'Create Agent',
  description:
    'Create a new CustomGPT agent by importing data from a sitemap or file',
  props: {
    project_name: Property.ShortText({
      displayName: 'Project Name',
      description: 'The name for your agent/project',
      required: true,
    }),
    sitemap_path: Property.ShortText({
      displayName: 'Sitemap URL',
      description:
        'URL to a sitemap for importing agent knowledge (leave empty if uploading a file)',
      required: false,
    }),
    file: Property.File({
      displayName: 'File',
      description:
        'Upload a file (text, audio, or video format) for agent knowledge (leave empty if using sitemap)',
      required: false,
    }),
  },
  async run(context) {
    const { project_name, sitemap_path, file } = context.propsValue;

    const body: any = {
      project_name,
    };

    if (sitemap_path) {
      body.sitemap_path = sitemap_path;
    }

    if (file) {
      body.file = file;
    }

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/projects',
      body
    );

    return response;
  },
});
