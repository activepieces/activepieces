import { Queue } from 'bullmq'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { ScheduledJobData } from '../../workers/flow-worker/job-data'
import { ApId, ScheduleType } from '@activepieces/shared'
import { createRedisClient } from '../redis-connection'
import { isNil } from 'lodash'
import { logger } from '../../helper/logger'

export class AddScheduleOptions1687384796637 implements MigrationInterface {
    name = 'AddScheduleOptions1687384796637'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info('Running AddScheduleOptions1687384796637 migration up')
        await queryRunner.query('ALTER TABLE "flow_instance" ADD "schedule" jsonb')
        await queryRunner.commitTransaction()
        await queryRunner.startTransaction()
        const updatedInstance = await copyCronExpressionFromRedisToNewColumn(queryRunner)
        logger.info(`Running AddScheduleOptions1687384796637 migration done, migrated ${updatedInstance} instances`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "flow_instance" DROP COLUMN "schedule"')
    }

}

async function copyCronExpressionFromRedisToNewColumn(queryRunner: QueryRunner): Promise<number> {
    let updatedInstance = 0
    const scheduledJobQueue = new Queue<ScheduledJobData, unknown, ApId>('repeatableJobs', {
        connection: createRedisClient(),
    })
    const scheduledJobs = await scheduledJobQueue.getJobs()
    logger.info(`Found ${scheduledJobs.length} Jobs for AddScheduleOptions1687384796637 migration`)
    const flowInstanceRepo = queryRunner.connection.getRepository('flow_instance')

    for (const job of scheduledJobs) {
        const { flowVersionId } = job.data
        const flowInstance = await flowInstanceRepo.findOneBy({
            flowVersionId,
        })
        if (!isNil(flowInstance)) {
            flowInstance.schedule = {
                type: ScheduleType.CRON_EXPRESSION,
                timezone: job.opts.repeat?.tz,
                cronExpression: job.opts.repeat?.pattern,
            }
            updatedInstance++
            await flowInstanceRepo.update(flowInstance.id, flowInstance)
        }
    }
    return updatedInstance
}