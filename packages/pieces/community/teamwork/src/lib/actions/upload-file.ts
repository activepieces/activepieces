import { createAction } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { TeamworkProps } from '../common/props';
import { TeamworkClient } from '../common/client';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { ApFile } from '../common/types'; 

export const uploadFileAction = createAction({
  auth: teamworkAuth,
  name: 'upload_file_to_project',
  displayName: 'Upload File to Project',
  description: 'Upload a file, with metadata and category, to a project.',
  props: {
    project_id: TeamworkProps.project_id,
    ...TeamworkProps.upload_file_props,
  },
  async run(context) {
    const authToken = context.auth;
    const { propsValue } = context;

    const meResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://www.teamwork.com/launchpad/v1/auth/me',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: authToken,
      },
    });

    const siteName = meResponse.body['installedAccounts'][0]['siteName'];
    if (!siteName) {
      throw new Error('Failed to retrieve Teamwork site name from auth token.');
    }

    const clientAuth = {
      auth: authToken,
    };
    const client = new TeamworkClient(clientAuth, siteName);

    return await client.uploadFileToProject(propsValue.project_id as string, {
      file: propsValue.file as ApFile,
      name: propsValue.file_name,
      category_id: propsValue.category_id,
      description: propsValue.description,
      parent_id: propsValue.parent_id,
    });
  },
});
