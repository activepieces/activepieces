import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pastDevAuth } from '../auth';
import { pastDevClient } from '../common/client';

export const deleteDataPointAction = createAction({
  auth: pastDevAuth,
  name: 'delete_data_point',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete data point',
  description:
    'Delete one data point by its source ID, with all the memory that past dev made from it.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently delete one data point from past dev by the source id that was sent at ingest, together with the memory derived from it. Use it when a source must be forgotten. A second call for the same id fails with not found.',
    idempotent: false,
  },
  props: {
    sourceId: Property.ShortText({
      displayName: 'Source ID',
      description:
        'The source ID that was sent in the Ingest step (its "Source ID" field, or the sourceId in its output).',
      required: true,
    }),
  },
  async run(context) {
    const sourceId = context.propsValue.sourceId.trim();
    if (sourceId.length === 0) {
      throw new Error('Source ID is empty.');
    }
    const response = await pastDevClient.sendRequest<DeletionReceipt>({
      connection: {
        apiKey: context.auth.props.apiKey,
        apiHost: context.auth.props.apiHost,
      },
      method: HttpMethod.DELETE,
      path: `/api/v1/data-points/${encodeURIComponent(sourceId)}`,
    });
    return {
      operationId: response.body.operationId,
      ids: response.body.ids,
      requestId: response.requestId,
    };
  },
});

type DeletionReceipt = {
  operationId: string;
  ids: string[];
};
