import { initFlowQueueConsumer } from './flow-queue-consumer';

export const flowWorkerModule = async (): Promise<void> => {
    await initFlowQueueConsumer();
};
