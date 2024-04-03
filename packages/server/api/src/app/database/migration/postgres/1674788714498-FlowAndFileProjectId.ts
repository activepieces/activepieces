import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '@activepieces/server-shared'

export class FlowAndFileProjectId1674788714498 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info('FlowAndFileProjectId1674788714498: started')

        const flowTableExistsQueryResponse: { exists: boolean }[] =
      await queryRunner.query(
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

        const flows = await queryRunner.query('SELECT * FROM flow')
        for (let i = 0; i < flows.length; ++i) {
            const currentFlow = flows[i]
            const collection = await queryRunner.query(
                'SELECT * FROM collection WHERE id = $1',
                [currentFlow.collectionId],
            )
            currentFlow.projectId = collection[0].projectId
            await queryRunner.query(
                'UPDATE flow SET "projectId" = $1 WHERE id = $2',
                [currentFlow.projectId, currentFlow.id],
            )
        }

        const flowVersions = await queryRunner.query('SELECT * FROM flow_version')
        for (let i = 0; i < flowVersions.length; ++i) {
            const currentFlowVersion = flowVersions[i]
            const currentFlow = await queryRunner.query(
                'SELECT * FROM flow WHERE id = $1',
                [currentFlowVersion.flowId],
            )
            let action = currentFlowVersion.trigger?.nextAction
            while (action !== undefined && action !== null) {
                if (action.type === 'CODE') {
                    const packagedFileId = action.settings.artifactPackagedId
                    if (packagedFileId !== undefined && packagedFileId !== null) {
                        const packagedFileToUpdate = await queryRunner.query(
                            'SELECT * FROM file WHERE id = $1',
                            [packagedFileId],
                        )
                        if (packagedFileToUpdate.length === 0) {
                            logger.error(
                                'Found an old packaged artifact file id without file ' +
                  packagedFileId +
                  ' and for flow ' +
                  currentFlow[0].id,
                            )
                        }
                        else {
                            packagedFileToUpdate[0].projectId = currentFlow[0].projectId
                            await queryRunner.query(
                                'UPDATE file SET "projectId" = $1 WHERE id = $2',
                                [packagedFileToUpdate[0].projectId, packagedFileId],
                            )
                        }
                    }
                    const sourceFileId = action.settings.artifactSourceId
                    if (sourceFileId !== undefined && sourceFileId !== null) {
                        const sourceFileToUpdate = await queryRunner.query(
                            'SELECT * FROM file WHERE id = $1',
                            [sourceFileId],
                        )
                        if (sourceFileToUpdate.length === 0) {
                            logger.error(
                                'Found an old source artifact file id without file ' +
                  sourceFileId +
                  ' and for flow ' +
                  currentFlow[0].id,
                            )
                        }
                        else {
                            sourceFileToUpdate[0].projectId = currentFlow[0].projectId
                            await queryRunner.query(
                                'UPDATE file SET "projectId" = $1 WHERE id = $2',
                                [sourceFileToUpdate[0].projectId, sourceFileId],
                            )
                        }
                    }
                }
                action = action.nextAction
            }
        }

        const flowRuns = await queryRunner.query('SELECT * FROM flow_run')
        for (let i = 0; i < flowRuns.length; ++i) {
            const currentFlowRun = flowRuns[i]
            if (
                currentFlowRun.logsFileId !== undefined &&
        currentFlowRun.logsFileId !== null
            ) {
                const logFlowRunFile = await queryRunner.query(
                    'SELECT * FROM file WHERE id = $1',
                    [currentFlowRun.logsFileId],
                )
                logFlowRunFile[0].projectId = currentFlowRun.projectId
                await queryRunner.query(
                    'UPDATE file SET "projectId" = $1 WHERE id = $2',
                    [logFlowRunFile[0].projectId, logFlowRunFile[0].id],
                )
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public async down(): Promise<void> {}
}
