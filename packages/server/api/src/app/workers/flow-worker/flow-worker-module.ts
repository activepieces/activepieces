import { flowQueueConsumer } from './flow-queue-consumer'

export const flowWorkerModule = async (): Promise<void> => {
    await flowQueueConsumer.init()
}
