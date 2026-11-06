import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { createCommentOutputSchema } from '../../../output-schemas';

export const createCommentAction = createAction({
  auth: podioAuth,
  name: 'podio_create_comment',
  outputSchema: createCommentOutputSchema,
  displayName: 'Create Comment',
  description: 'Adds a comment to an item, task, status or other object.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Posts a comment on one Podio object, chosen by Object Type and Object ID (an item id from the item actions, a task id from List Tasks or Create Task, a status id from Create Status). Each call posts a new comment; use Update Comment to correct one.',
    idempotent: false,
  },
  props: {
    type: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of object to comment on, such as "item", "task" or "status".' }),
    id: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the object to comment on.' }),
    value: podioAiProps.longText({ required: true, displayName: 'Comment', description: 'The text of the comment.' }),
    externalId: podioAiProps.text({ required: false, displayName: 'External ID', description: 'An id for the comment from another system.' }),
    fileIds: podioAiProps.idList({ required: false, displayName: 'File IDs', description: 'Ids of uploaded files to attach, from Upload File.' }),
    embedId: podioAiProps.id({ required: false, displayName: 'Embed ID', description: 'The id of a link embed to attach, from Create Embed.' }),
    embedUrl: podioAiProps.text({ required: false, displayName: 'Embed URL', description: 'A URL to attach as a link.' }),
    alertInvite: podioAiProps.bool({ required: false, displayName: 'Invite Mentioned Users', description: '"true" invites mentioned users who cannot see the object to the workspace. Defaults to "false".' }),
    hook: podioAiProps.hook({ required: false }),
    silent: podioAiProps.silent({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { type, id, value, externalId, fileIds, embedId, embedUrl, alertInvite, hook, silent } = propsValue;
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/comment/${type}/${id}/`,
      query: podioUtils.query({
        values: {
          alert_invite: podioUtils.toBool({ value: alertInvite }),
          hook: podioUtils.toBool({ value: hook }),
          silent: podioUtils.toBool({ value: silent }),
        },
      }),
      body: podioUtils.body({
        values: {
          value,
          external_id: externalId || undefined,
          file_ids: fileIds?.length ? fileIds.map(Number) : undefined,
          embed_id: embedId ? Number(embedId) : undefined,
          embed_url: embedUrl || undefined,
        },
      }),
    });
  },
});
