import { initFlowQueueConsumer } from './flow-queue-consumer'
import { migrateScheduledJobs } from './flow-queue-migration'

export const flowWorkerModule = async (): Promise<void> => {
    await migrateScheduledJobs()
    await initFlowQueueConsumer()
}
