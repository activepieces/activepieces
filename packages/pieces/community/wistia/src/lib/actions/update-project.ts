import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wistiaAuth } from '../../';
import { flattenProject, wistiaApiCall, wistiaCommon, WistiaProject } from '../common';

export const updateProjectAction = createAction({
  auth: wistiaAuth,
  name: 'update_project',
  displayName: 'Update Project',
  description: 'Update the attributes of an existing project.',
  props: {
    projectId: wistiaCommon.projectDropdown(true),
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'A new name for the project. Leave empty to keep the current name.',
      required: false,
    }),
    anonymousCanUpload: Property.Checkbox({
      displayName: 'Allow Anonymous Uploads',
      description: 'Allow anonymous (logged-out) users to upload media to this project.',
      required: false,
    }),
    anonymousCanDownload: Property.Checkbox({
      displayName: 'Allow Anonymous Downloads',
      description: 'Allow anonymous (logged-out) users to download media from this project.',
      required: false,
    }),
    public: Property.Checkbox({
      displayName: 'Public',
      description: 'Make the project accessible to anyone with the public link.',
      required: false,
    }),
  },
  async run(context) {
    const { projectId, name, anonymousCanUpload, anonymousCanDownload, public: isPublic } =
      context.propsValue;

    const body: Record<string, string | number> = {};
    if (name !== undefined) body['name'] = name;
    if (anonymousCanUpload !== undefined) body['anonymousCanUpload'] = anonymousCanUpload ? 1 : 0;
    if (anonymousCanDownload !== undefined)
      body['anonymousCanDownload'] = anonymousCanDownload ? 1 : 0;
    if (isPublic !== undefined) body['public'] = isPublic ? 1 : 0;

    const response = await wistiaApiCall<WistiaProject>({
      token: context.auth.secret_text,
      method: HttpMethod.PUT,
      resourceUrl: `/projects/${projectId}.json`,
      body,
    });

    return flattenProject(response.body);
  },
});
