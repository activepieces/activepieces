import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetFilesOutputSchema } from '../../../output-schemas';

export const getFilesAction = createAction({
  auth: podioAuth,
  name: 'podio_get_files',
  outputSchema: podioGetFilesOutputSchema,
  displayName: 'Get Files',
  description: 'Lists the files the user can see, filtered and sorted.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Podio files across every workspace the user can see, filtered by attachment type, creator, date, file type or host. Use Get Files On App or Get Files On Space to stay inside one app or workspace.',
    idempotent: true,
  },
  props: {
    attachedTo: podioAiProps.choice({ required: false, displayName: 'Attached To', description: 'Only files attached to this type of object.', values: ['item', 'status', 'task', 'space'] }),
    createdBy: podioAiProps.text({ required: false, displayName: 'Created By', description: 'Only files created by these entities, written as Podio auth references such as "user:123".' }),
    createdOn: podioAiProps.text({ required: false, displayName: 'Created On', description: 'Only files created in this date range, written as "from-to" dates such as "2024-01-01-2024-01-31".' }),
    filetype: podioAiProps.choice({ required: false, displayName: 'File Type', description: 'Only files of this type.', values: ['image', 'application', 'video', 'text', 'audio'] }),
    hostedBy: podioAiProps.choice({ required: false, displayName: 'Hosted By', description: 'Only files hosted by this provider.', values: ['podio', 'google', 'boxnet', 'dropbox', 'evernote', 'live', 'sharefile', 'sugarsync', 'yousendit'] }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of files to return. Defaults to 20.' }),
    sortBy: podioAiProps.choice({ required: false, displayName: 'Sort By', description: 'The attribute to sort by. Defaults to "name".', values: ['name', 'created_on'] }),
    sortDesc: podioAiProps.bool({ required: false, displayName: 'Sort Descending', description: '"true" sorts descending, "false" ascending. Defaults to "true".' }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: '/file/',
      query: podioUtils.query({
        values: {
          attached_to: propsValue.attachedTo,
          created_by: propsValue.createdBy,
          created_on: propsValue.createdOn,
          filetype: propsValue.filetype,
          hosted_by: propsValue.hostedBy,
          limit: propsValue.limit ?? 20,
          sort_by: propsValue.sortBy,
          sort_desc: podioUtils.toBool({ value: propsValue.sortDesc }),
        },
      }),
    });
    return { files: body, count: body.length };
  },
});
