import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { figmaAuth } from '../auth';
import { figmaClient, FigmaApiError } from '../common/client';
import { figmaProps } from '../common/props';
import { figmaOutputSchemas } from '../output-schemas';

export const postCommentAction = createAction({
  auth: figmaAuth,
  name: 'post_comment',
  classification: 'WRITE',
  displayName: 'Post File Comment',
  description: 'Posts a comment on a Figma file, as a reply to a comment or pinned to a layer.',
  audience: 'both',
  aiMetadata: {
    description:
      'Posts a comment on a Figma file (file URL or key). Optional Reply To Comment ID makes it a reply (must be a top-level comment, not a reply); optional Pin to Node ID attaches it to a layer like 1:2 (not allowed for replies). Returns the created comment under response_body. Not idempotent: each call adds another comment.',
    idempotent: false,
  },
  outputSchema: figmaOutputSchemas.postComment,
  props: {
    file_key: figmaProps.fileKey(),
    message: Property.LongText({
      displayName: 'Comment',
      description: 'The comment text.',
      required: true,
    }),
    comment_id: Property.ShortText({
      displayName: 'Reply To Comment ID',
      description: 'Post as a reply to this top-level comment. Leave empty for a new comment.',
      required: false,
    }),
    node_id: Property.ShortText({
      displayName: 'Pin to Node ID',
      description: 'Attach the comment to this layer (e.g. 1:2). Not used for replies. Leave empty to post on the canvas.',
      required: false,
    }),
  },
  async run(context) {
    const parsed = figmaClient.parseFileKey(context.propsValue.file_key);
    const message = typeof context.propsValue.message === 'string' ? context.propsValue.message : '';
    if (message.trim() === '') throw new Error('Comment is required.');
    const replyTo = figmaClient.optionalText(context.propsValue.comment_id);
    const nodeText = figmaClient.optionalText(context.propsValue.node_id);
    const nodeId = nodeText === undefined ? undefined : figmaClient.nodeIds({ value: nodeText, required: true })[0];
    if (replyTo !== undefined && nodeId !== undefined) {
      throw new Error('A reply cannot be pinned to a node. Clear either Reply To Comment ID or Pin to Node ID.');
    }
    const body: Record<string, unknown> = {
      message,
      ...(replyTo !== undefined ? { comment_id: replyTo } : {}),
      ...(nodeId !== undefined ? { client_meta: { node_id: nodeId, node_offset: { x: 0, y: 0 } } } : {}),
    };
    try {
      const response = await figmaClient.request<Record<string, unknown>>({
        auth: context.auth,
        method: HttpMethod.POST,
        path: `/v1/files/${figmaClient.segment({ value: parsed.fileKey, label: 'File Key' })}/comments`,
        body,
        scope: 'file_comments:write',
        tier: 2,
        operation: 'post the comment',
      });
      return { success: true, request_body: body, response_body: response.body };
    } catch (error) {
      if (error instanceof FigmaApiError && error.status === 400 && replyTo !== undefined) {
        throw new FigmaApiError(`${error.message} Replies must target a top-level comment ID (one whose parent_id is empty).`, error.status, error.responseBody);
      }
      throw error;
    }
  },
});
