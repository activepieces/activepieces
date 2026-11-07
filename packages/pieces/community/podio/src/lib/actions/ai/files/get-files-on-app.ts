import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetFilesOutputSchema } from '../../../output-schemas';

export const getFilesOnAppAction = createAction({
  auth: podioAuth,
  name: 'podio_get_files_on_app',
  outputSchema: podioGetFilesOutputSchema,
  displayName: 'Get Files On App',
  description: 'Lists the files on the items of an app, including files on their comments.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the Podio files on the items of an app, including files on their comments, filtered by attachment type, creator, date, file type or host, paged with limit and offset. The app id comes from List Apps In Space.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app, from List Apps In Space.' }),
    attachedTo: podioAiProps.choice({ required: false, displayName: 'Attached To', description: 'Only files attached to this type of object.', values: ['item', 'status', 'task', 'space'] }),
    createdBy: podioAiProps.text({ required: false, displayName: 'Created By', description: 'Only files created by these entities, written as Podio auth references such as "user:123".' }),
    createdOn: podioAiProps.text({ required: false, displayName: 'Created On', description: 'Only files created in this date range, written as "from-to" dates such as "2024-01-01-2024-01-31".' }),
    filetype: podioAiProps.choice({ required: false, displayName: 'File Type', description: 'Only files of this type.', values: ['image', 'application', 'video', 'text', 'audio'] }),
    hostedBy: podioAiProps.choice({ required: false, displayName: 'Hosted By', description: 'Only files hosted by this provider.', values: ['podio', 'google', 'boxnet', 'dropbox', 'evernote', 'live', 'sharefile', 'sugarsync', 'yousendit'] }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of files to return. Defaults to 20.' }),
    offset: podioAiProps.offset({ required: false }),
    sortBy: podioAiProps.choice({ required: false, displayName: 'Sort By', description: 'The attribute to sort by. Defaults to "name".', values: ['name', 'created_on'] }),
    sortDesc: podioAiProps.bool({ required: false, displayName: 'Sort Descending', description: '"true" sorts descending, "false" ascending. Defaults to "true".' }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/file/app/${propsValue.appId}/`,
      query: podioUtils.query({
        values: {
          attached_to: propsValue.attachedTo,
          created_by: propsValue.createdBy,
          created_on: propsValue.createdOn,
          filetype: propsValue.filetype,
          hosted_by: propsValue.hostedBy,
          limit: propsValue.limit ?? 20,
          offset: propsValue.offset,
          sort_by: propsValue.sortBy,
          sort_desc: podioUtils.toBool({ value: propsValue.sortDesc }),
        },
      }),
    });
    return { files: body, count: body.length };
  },
});
