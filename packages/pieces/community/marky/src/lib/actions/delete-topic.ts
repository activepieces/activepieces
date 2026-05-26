import { createAction } from '@activepieces/pieces-framework';

import { markyAuth } from '../auth';
import { markyClient } from '../common/client';
import { markyProps } from '../common/props';
import { markyUtils } from '../common/utils';

const deleteTopicAction = createAction({
  auth: markyAuth,
  name: 'delete-topic',
  displayName: 'Delete Topic',
  description: 'Soft-delete a Marky topic.',
  props: {
    businessId: markyProps.business(),
    topicId: markyProps.topic(),
  },
  async run(context) {
    const topicId = markyUtils.getRequiredString({
      value: context.propsValue.topicId,
      fieldName: 'Topic',
    });

    const result = await markyClient.deleteTopic({
      apiKey: context.auth.secret_text,
      topicId,
    });

    if (!result.ok) {
      throw new Error(`Failed to delete topic: ${result.message}`);
    }

    return result.data;
  },
});

export { deleteTopicAction };
