import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wistiaAuth } from '../../';
import { flattenProject, wistiaApiCall, WistiaProject } from '../common';

export const createProjectAction = createAction({
  auth: wistiaAuth,
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Create a new project in your Wistia account.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new Wistia project to hold media, with an optional admin owner email and anonymous-upload/download and public-link visibility flags. Use when an agent needs a new container before adding media. Not idempotent: each call creates a separate project even with the same name.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'The name of the new project.',
      required: true,
    }),
    adminEmail: Property.ShortText({
      displayName: 'Admin Email',
      description:
        'The email of the user who will own the project. Defaults to the owner of the API token if left empty.',
      required: false,
    }),
    anonymousCanUpload: Property.Checkbox({
      displayName: 'Allow Anonymous Uploads',
      description: 'Allow anonymous (logged-out) users to upload media to this project.',
      required: false,
      defaultValue: false,
    }),
    anonymousCanDownload: Property.Checkbox({
      displayName: 'Allow Anonymous Downloads',
      description: 'Allow anonymous (logged-out) users to download media from this project.',
      required: false,
      defaultValue: false,
    }),
    public: Property.Checkbox({
      displayName: 'Public',
      description: 'Make the project accessible to anyone with the public link.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { name, adminEmail, anonymousCanUpload, anonymousCanDownload, public: isPublic } =
      context.propsValue;

    const response = await wistiaApiCall<WistiaProject>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      resourceUrl: '/projects.json',
      body: {
        name,
        adminEmail,
        anonymousCanUpload: anonymousCanUpload ? 1 : 0,
        anonymousCanDownload: anonymousCanDownload ? 1 : 0,
        public: isPublic ? 1 : 0,
      },
    });

    return flattenProject(response.body);
  },
});
