import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { podioClient } from '../common/client';
import { podioProps } from '../common/props';
import { podioAuth } from '../auth';
import { createCommentOutputSchema } from '../output-schemas';

export const createCommentAction = createAction({
  auth: podioAuth,
  name: 'create_comment',
  outputSchema: createCommentOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Comment',
  description: 'Post a comment on an item or task.',
  audience: 'human',
  aiMetadata: { description: 'Posts a text comment on a Podio item or task, chosen via the comment-on type and object id, with optional file or embed attachments. Use to add a note or reply to a record; requires the target type/id and comment text. Not idempotent — each call posts a separate comment.', idempotent: false },
  props: {
    orgId: podioProps.orgId({ required: true }),
    spaceId: podioProps.spaceId({ required: true }),
    appId: podioProps.appId({ required: true }),

    type: Property.Dropdown({
      auth: podioAuth,
      displayName: 'Comment On',
      description: 'What type of object to comment on',
      required: true,
      refreshers: [],
      options: async () => {
        return {
          options: [
            { label: 'Item', value: 'item' },
            { label: 'Task', value: 'task' },
          ],
        };
      },
    }),
    id: podioProps.commentObjectId({ required: true }),

    value: Property.LongText({
      displayName: 'Comment Text',
      description: 'The content of your comment',
      required: true,
    }),
    externalId: Property.ShortText({
      displayName: 'External ID',
      description: 'Optional external identifier for the comment',
      required: false,
    }),

    fileIds: Property.Array({
      displayName: 'Attach Files',
      description: 'Select files from the space to attach to this comment (enter file IDs from the space)',
      required: false,
    }),
    embedId: Property.Number({
      displayName: 'Embed ID',
      description: 'ID of a previously created embedded link',
      required: false,
    }),
    embedUrl: Property.ShortText({
      displayName: 'Embed URL',
      description: 'URL to embed in the comment',
      required: false,
    }),

    alertInvite: Property.Checkbox({
      displayName: 'Auto-Invite Mentioned Users',
      description: 'Automatically invite mentioned users to the workspace if they lack access',
      required: false,
      defaultValue: false,
    }),

    silent: podioProps.silent({ required: false }),
    hook: podioProps.hook({ required: false }),
  },
  async run(context) {
    const { 
      appId,
      spaceId,
      type, 
      id, 
      value, 
      externalId, 
      fileIds, 
      embedId, 
      embedUrl, 
      alertInvite, 
      silent, 
      hook 
    } = context.propsValue;

    if (!type) {
      throw new Error('Comment target type is required. Please select what type of object to comment on.');
    }

    if (!id) {
      throw new Error('Target object is required. Please select the specific object to comment on.');
    }

    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      throw new Error('Comment text is required and cannot be empty.');
    }

    if (type === 'item' && !appId) {
      throw new Error('App selection is required when commenting on items. Please select an app first.');
    }

    if (fileIds && !Array.isArray(fileIds)) {
      throw new Error('File IDs must be provided as an array.');
    }

    if (embedId && typeof embedId !== 'number') {
      throw new Error('Embed ID must be a number.');
    }

    const body: CreateCommentBody = {
      value: value.trim(),
    };

    if (externalId && externalId.trim()) {
      body.external_id = externalId.trim();
    }

    if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
      body.file_ids = fileIds;
    }

    if (embedId) {
      body.embed_id = embedId;
    }

    if (embedUrl && embedUrl.trim()) {
      body.embed_url = embedUrl.trim();
    }

    if (typeof alertInvite === 'boolean') {
      body.alert_invite = alertInvite;
    }

    const queryParams: QueryParams = {};
    if (typeof silent === 'boolean') {
      queryParams['silent'] = silent.toString();
    }
    if (typeof hook === 'boolean') {
      queryParams['hook'] = hook.toString();
    }

    return await podioClient.request<{
      comment_id: number;
    }>({
      method: HttpMethod.POST,
      auth: context.auth,
      path: `/comment/${type}/${id}`,
      body,
      query: queryParams,
    });
  },
});

type CreateCommentBody = {
  value: string;
  external_id?: string;
  file_ids?: unknown[];
  embed_id?: number;
  embed_url?: string;
  alert_invite?: boolean;
};
