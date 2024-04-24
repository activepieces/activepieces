import { flowQueueConsumer } from './consumer/flow-queue-consumer'

export const flowWorkerModule = async (): Promise<void> => {
    await flowQueueConsumer.init()
}
