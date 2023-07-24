import { logger } from '../../../helper/logger'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class FlowAndFileProjectId1674788714498 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info('FlowAndFileProjectId1674788714498: started')

        const flowTableExistsQueryResponse: { exists: boolean }[] = await queryRunner.query(
            `SELECT exists (
            SELECT FROM information_schema.tables
              WHERE  table_schema = 'public'
              AND    table_name   = 'flow'
          )`,
        )

        const flowTableNotExist =
          flowTableExistsQueryResponse &&
          flowTableExistsQueryResponse.length > 0 &&
          !flowTableExistsQueryResponse[0].exists

        if (flowTableNotExist) {
            logger.info('FlowAndFileProjectId1674788714498: skipped')
            return
        }

        const flowRepo = queryRunner.connection.getRepository('flow')
        const fileRepo = queryRunner.connection.getRepository('file')
        const flowRunRepo = queryRunner.connection.getRepository('flow_run')
        const flowVersionRepo = queryRunner.connection.getRepository('flow_version')
        const collectionRepo = queryRunner.connection.getRepository('collection')

        logger.info('Running Flow migeration')
        const flows = await flowRepo.find({})
        for (let i = 0; i < flows.length; ++i) {
            const currentFlow = flows[i]
            const collection = await collectionRepo.findOneBy({ id: currentFlow.collectionId })
            currentFlow.projectId = collection!.projectId
            await flowRepo.update(currentFlow.id, currentFlow)
        }

        logger.info('Running File migeration')
        const flowVersions = await flowVersionRepo.find({})
        for (let i = 0; i < flowVersions.length; ++i) {
            const currentFlowVersion = flowVersions[i]
            const currentFlow = await flowRepo.findOneBy({ id: currentFlowVersion.flowId })
            let action = currentFlowVersion.trigger?.nextAction
            while (action !== undefined && action !== null) {
                if (action.type === 'CODE') {
                    const packagedFileId = action.settings.artifactPackagedId
                    if (packagedFileId !== undefined && packagedFileId !== null) {
                        const packagedFileToUpdate = await fileRepo.findOneBy({ id: packagedFileId })
                        if (packagedFileToUpdate === null) {
                            logger.error('Found an old packaged artifact file id without file ' + packagedFileId + ' and for flow ' + currentFlow!.id)
                        }
                        else {
                            packagedFileToUpdate.projectId = currentFlow!.projectId
                            await fileRepo.update(packagedFileId, packagedFileToUpdate)
                        }
                    }
                    const sourceFileId = action.settings.artifactSourceId
                    if (sourceFileId !== undefined && sourceFileId !== null) {
                        const sourceFileToUpdate = await fileRepo.findOneBy({ id: sourceFileId })
                        if (sourceFileToUpdate === null) {
                            logger.error('Found an old source artifact file id without file ' + sourceFileId + ' and for flow ' + currentFlow!.id)
                        }
                        else {
                            sourceFileToUpdate.projectId = currentFlow!.projectId
                            await fileRepo.update(sourceFileId, sourceFileToUpdate)
                        }
                    }
                }
                action = action.nextAction
            }
        }

        logger.info('Running Flow Run migration')
        const flowRuns = await flowRunRepo.find()
        for (let i = 0; i < flowRuns.length; ++i) {
            const currentFlowRun = flowRuns[i]
            if (currentFlowRun.logsFileId !== undefined && currentFlowRun.logsFileId !== null) {
                const logFlowRunFile = await fileRepo.findOneBy({ id: currentFlowRun.logsFileId })
                logFlowRunFile!.projectId = currentFlowRun.projectId
                await fileRepo.update(logFlowRunFile!.id, logFlowRunFile!)
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public async down(): Promise<void> { }

}
