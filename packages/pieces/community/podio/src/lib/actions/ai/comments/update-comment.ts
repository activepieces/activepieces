import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioApi } from '../../../common/api';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';

export const updateCommentAction = createAction({
  auth: podioAuth,
  name: 'podio_update_comment',
  displayName: 'Update Comment',
  description: 'Edits the text, files or link of a comment.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Edits one Podio comment, meant for correcting its text; fields left unset keep their current value, including the attached files and link. Set at least one field. The comment id comes from List Comments or Create Comment.',
    idempotent: true,
  },
  props: {
    commentId: podioAiProps.id({ required: true, displayName: 'Comment ID', description: 'The id of the comment to edit.' }),
    value: podioAiProps.longText({ required: false, displayName: 'Comment', description: 'The new text of the comment.' }),
    externalId: podioAiProps.text({ required: false, displayName: 'External ID', description: 'A new id for the comment from another system.' }),
    fileIds: podioAiProps.idList({ required: false, displayName: 'File IDs', description: 'Ids of the files the comment should have, replacing the current ones, from Upload File.' }),
    embedId: podioAiProps.id({ required: false, displayName: 'Embed ID', description: 'The id of a link embed to attach instead of the current one, from Create Embed.' }),
    embedUrl: podioAiProps.text({ required: false, displayName: 'Embed URL', description: 'A URL to attach as a link instead of the current one.' }),
  },
  async run({ auth, propsValue }) {
    const { commentId, value, externalId, fileIds, embedId, embedUrl } = propsValue;
    if (!value && !externalId && !fileIds?.length && !embedId && !embedUrl) {
      throw new Error('Set at least one of Comment, External ID, File IDs, Embed ID or Embed URL.');
    }
    const current = await podioApi.getComment({ auth, commentId });
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/comment/${commentId}`,
      body: podioUtils.body({
        values: {
          value: value || current.value,
          external_id: externalId || current.external_id || undefined,
          file_ids: fileIds?.length ? fileIds.map(Number) : current.files?.map((file) => file.file_id),
          embed_id: pickEmbedId({ embedId, embedUrl, currentEmbedId: current.embed?.embed_id }),
          embed_url: embedUrl || undefined,
        },
      }),
    });
  },
});

function pickEmbedId({ embedId, embedUrl, currentEmbedId }: { embedId: string | undefined; embedUrl: string | undefined; currentEmbedId: number | undefined }): number | undefined {
  if (embedId) return Number(embedId);
  if (embedUrl) return undefined;
  return currentEmbedId;
}
