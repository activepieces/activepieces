import { OutputSchema } from '@activepieces/pieces-framework';

export const pushToQueueOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'queue',
      label: 'Queue Item',
      value: '',
      description: 'Every item now in the queue, oldest first, including the ones just pushed.',
    },
  ],
};

export const pullFromQueueOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Pulled Item',
      value: '',
      description: 'Items removed from the front of the queue, oldest first. Empty when the queue was empty.',
    },
  ],
};

export const clearQueueOutputSchema: OutputSchema = {
  fields: [{ key: 'success', label: 'Cleared', format: 'boolean' }],
};

export const peekQueueOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Item',
      description: 'The oldest items in the queue, oldest first. They stay in the queue.',
    },
    { key: 'itemCount', label: 'Items Returned', format: 'number' },
    { key: 'queueSize', label: 'Total Items in Queue', format: 'number' },
  ],
};

export const getQueueSizeOutputSchema: OutputSchema = {
  fields: [
    { key: 'queueName', label: 'Queue Name' },
    { key: 'size', label: 'Items in Queue', format: 'number' },
    { key: 'isEmpty', label: 'Is Empty', format: 'boolean' },
  ],
};
