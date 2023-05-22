import { migrateScheduledJobs } from './flow-queue'
import { initFlowQueueConsumer } from './flow-queue-consumer'

export const flowWorkerModule = async (): Promise<void> => {
    await migrateScheduledJobs()
    await initFlowQueueConsumer()
}
