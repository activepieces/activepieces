import { createPiece } from '@activepieces/pieces-framework';
import { amazonSqsAuth } from './lib/auth';
import { sendMessage } from './lib/actions/send-message';
import { sendMessageBatch } from './lib/actions/send-message-batch';
import { receiveMessages } from './lib/actions/receive-messages';
import { deleteMessage } from './lib/actions/delete-message';
import { changeMessageVisibility } from './lib/actions/change-message-visibility';
import { listQueues } from './lib/actions/list-queues';
import { getQueueAttributes } from './lib/actions/get-queue-attributes';
import { purgeQueue } from './lib/actions/purge-queue';
import { newMessage } from './lib/triggers/new-message';

export { amazonSqsAuth };

export const awsSqs = createPiece({
  displayName: 'Amazon SQS',
  auth: amazonSqsAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/aws-sqs.png',
  authors: ['abuaboud'],
  actions: [
    sendMessage,
    sendMessageBatch,
    receiveMessages,
    deleteMessage,
    changeMessageVisibility,
    listQueues,
    getQueueAttributes,
    purgeQueue,
  ],
  triggers: [newMessage],
});
