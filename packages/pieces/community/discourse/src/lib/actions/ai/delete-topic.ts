import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { DiscourseApiError, discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseSchemas } from '../../common/schemas';

export const deleteTopicAction = createAction({
  auth: discourseAuth,
  name: 'delete_topic',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Topic',
  description: 'Deletes a Discourse topic and its posts.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Delete a Discourse topic and all its posts by numeric topic ID. Staff can still recover it from the forum UI, but it disappears for members immediately. Only call when the user clearly asked to delete. A topic that was already soft-deleted is reported with already_deleted true, so retries are safe; an unknown ID fails with a not found error.',
    idempotent: true,
  },
  props: {
    topic_id: Property.ShortText({ displayName: 'Topic ID', description: 'Numeric topic ID.', required: true }),
  },
  outputSchema: discourseSchemas.deleted,
  async run({ auth, propsValue }) {
    const id = discourseInput.id({ value: propsValue.topic_id, label: 'Topic ID' });
    try {
      const current = discourseMap.rec(
        await discourseRequest({ auth: auth.props, method: HttpMethod.GET, path: `/t/${id}.json` }),
      );
      if (current['deleted_at'] !== null && current['deleted_at'] !== undefined) {
        return { id: Number(id), deleted: true, already_deleted: true };
      }
      await discourseRequest({ auth: auth.props, method: HttpMethod.DELETE, path: `/t/${id}.json` });
      return { id: Number(id), deleted: true, already_deleted: false };
    } catch (error) {
      if (error instanceof DiscourseApiError && error.status === 404) {
        throw new DiscourseApiError({
          message: `Discourse topic ${id} was not found. Check the Topic ID; nothing was deleted.`,
          status: 404,
          responseBody: error.responseBody,
        });
      }
      throw error;
    }
  },
});
