import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { getWrikeApiUrl, wrikeAuth } from '../common/common';
import { Property, createAction } from '@activepieces/pieces-framework';

export const createProjectAction = createAction({
  auth: wrikeAuth,
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Creates a new project in Wrike',
  props: {
    parentFolderId: Property.ShortText({
      displayName: 'Parent Folder ID',
      description: 'The parent folder ID',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Project title',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Project description',
      required: false,
    }),
    startDate: Property.ShortText({
      displayName: 'Start Date',
      description: 'Start date (YYYY-MM-DD format)',
      required: false,
    }),
    endDate: Property.ShortText({
      displayName: 'End Date',
      description: 'End date (YYYY-MM-DD format)',
      required: false,
    }),
  },
  async run(context) {
    const apiUrl = await getWrikeApiUrl(context.auth);
    const body: any = {
      title: context.propsValue.title,
      project: {
        ownerIds: [],
      },
    };

    if (context.propsValue.description) {
      body.description = context.propsValue.description;
    }
    if (context.propsValue.startDate || context.propsValue.endDate) {
      body.project.startDate = context.propsValue.startDate;
      body.project.endDate = context.propsValue.endDate;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${apiUrl}/folders/${context.propsValue.parentFolderId}/folders`,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return response.body.data[0];
  },
});
