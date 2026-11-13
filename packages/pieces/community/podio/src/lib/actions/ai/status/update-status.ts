import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioApi } from '../../../common/api';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';

export const updateStatusAction = createAction({
  auth: podioAuth,
  name: 'podio_update_status',
  displayName: 'Update Status',
  description: 'Edits the text, files or link of a status message.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Edits one Podio status message, meant for correcting its text; fields left unset keep their current value, including the attached files and link. Set at least one field. The status id comes from Create Status or a stream action such as Get Space Stream.',
    idempotent: true,
  },
  props: {
    statusId: podioAiProps.id({ required: true, displayName: 'Status ID', description: 'The id of the status message to edit.' }),
    value: podioAiProps.longText({ required: false, displayName: 'Message', description: 'The new text of the status message.' }),
    fileIds: podioAiProps.idList({ required: false, displayName: 'File IDs', description: 'Ids of the files the status should have, replacing the current ones, from Upload File.' }),
    embedId: podioAiProps.id({ required: false, displayName: 'Embed ID', description: 'The id of a link embed to attach instead of the current one, from Create Embed.' }),
    embedUrl: podioAiProps.text({ required: false, displayName: 'Embed URL', description: 'A URL to attach as a link instead of the current one.' }),
  },
  async run({ auth, propsValue }) {
    const { statusId, value, fileIds, embedId, embedUrl } = propsValue;
    if (!value && !fileIds?.length && !embedId && !embedUrl) {
      throw new Error('Set at least one of Message, File IDs, Embed ID or Embed URL.');
    }
    const current = await podioApi.getStatus({ auth, statusId });
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/status/${statusId}`,
      body: podioUtils.body({
        values: {
          value: value || current.value,
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
