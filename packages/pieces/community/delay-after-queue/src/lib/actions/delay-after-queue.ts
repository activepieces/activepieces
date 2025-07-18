import {
  createAction,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';

export const delayAfterQueue = createAction({
  name: 'delay_after_queue',
  displayName: 'Delay After Queue',
  description:
    'Delay After Queue enables rate control when multiple flows reach this step at the same time. ' +
    'Flows using the same queue name are processed one at a time, in the order they arrive, ' +
    'with the interval you set applied between each execution.',
  props: {
    queueName: Property.ShortText({
      displayName: 'Queue Name',
      description: 'Unique queue identifier for rate control',
      required: true,
    }),
    delayUnit: Property.StaticDropdown({
      displayName: 'Delay Unit',
      description: 'Choose the unit for delay',
      required: true,
      options: {
        options: [
          { label: 'Seconds', value: 'seconds' },
          { label: 'Minutes', value: 'minutes' },
          { label: 'Hours', value: 'hours' },
        ],
      },
      defaultValue: 'seconds',
    }),
    delayAmount: Property.Number({
      displayName: 'Delay Amount',
      description: 'Enter the amount of time to delay',
      required: true,
      defaultValue: 5,
    }),
  },
  async run(context) {
    const queueName = context.propsValue.queueName;
    const delayAmount = context.propsValue.delayAmount;
    const delayUnit = context.propsValue.delayUnit;

    // Convert to milliseconds
    let delayMs = delayAmount * 1000;
    if (delayUnit === 'minutes') delayMs = delayAmount * 60 * 1000;
    if (delayUnit === 'hours') delayMs = delayAmount * 60 * 60 * 1000;

    const key = `delay_queue::${queueName}`;
    const store = context.store;
    const currentFlowId = context.run.id;

    try {
      // Add this run to the queue
      const existingQueue = (await store.get<string[]>(key, StoreScope.PROJECT)) || [];
      const updatedQueue = [...existingQueue, currentFlowId];
      await store.put(key, updatedQueue, StoreScope.PROJECT);

      // Wait until it's this flow's turn
      while (true) {
        const latestQueue = (await store.get<string[]>(key, StoreScope.PROJECT)) || [];
        if (latestQueue[0] === currentFlowId) break;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Apply the delay
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      // Remove from queue
      const afterQueue = (await store.get<string[]>(key, StoreScope.PROJECT)) || [];
      const newQueue = afterQueue.filter((id: string) => id !== currentFlowId);

      if (newQueue.length === 0) {
        await store.delete(key, StoreScope.PROJECT);
      } else {
        await store.put(key, newQueue, StoreScope.PROJECT);
      }

      return {
        status: 'done',
        queueName,
        delayAmount,
        delayUnit,
        message: `Delayed execution for queue '${queueName}' by ${delayAmount} ${delayUnit}.`,
      };
    } catch (error) {
      // Clean up on error
      try {
        const afterQueue = (await store.get<string[]>(key, StoreScope.PROJECT)) || [];
        const newQueue = afterQueue.filter((id: string) => id !== currentFlowId);
        
        if (newQueue.length === 0) {
          await store.delete(key, StoreScope.PROJECT);
        } else {
          await store.put(key, newQueue, StoreScope.PROJECT);
        }
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      throw error;
    }
  },
  async test(context) {
    // For testing, we'll simulate the delay without actually waiting
    const queueName = context.propsValue.queueName;
    const delayAmount = context.propsValue.delayAmount;
    const delayUnit = context.propsValue.delayUnit;

    return {
      status: 'test_simulation',
      queueName,
      delayAmount,
      delayUnit,
      message: `Test simulation: Would delay execution for queue '${queueName}' by ${delayAmount} ${delayUnit}.`,
    };
  },
});
