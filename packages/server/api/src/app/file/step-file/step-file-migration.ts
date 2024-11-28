import { ApLock, logger } from '@activepieces/server-shared'
import { FileCompression, FileType } from '@activepieces/shared'
import { databaseConnection } from '../../database/database-connection'
import { distributedLock } from '../../helper/lock'
import { fileService } from '../file.service'

const BATCH_SIZE = 1000
const LOCK_KEY = 'step-file-migration'
const LOCK_TIMEOUT = 120 * 60 * 1000 // 2 hours

// This migration moves step files to the file table and S3 storage.
// It should be removed by the end of 2024.
// If the upgrade is missed, users may lose sample data in flow projects,
// which previously expired after 7 days.
// TODO: remove in 2025
export const stepFileMigration = {
    async migrate() {
        let lock: ApLock | null = null
        try {
            lock = await distributedLock.acquireLock({ key: LOCK_KEY, timeout: LOCK_TIMEOUT })
            
            const queryRunner = databaseConnection().createQueryRunner()

            try {
                await queryRunner.connect()

                const stepFileTableExists = await queryRunner.hasTable('step_file')

                if (!stepFileTableExists) {
                    return
                }

                let hasMore = true

                while (hasMore) {
                    const stepFiles = await queryRunner.query(
                        `SELECT * FROM step_file LIMIT ${BATCH_SIZE}`,
                    )

                    if (stepFiles.length === 0) {
                        hasMore = false
                        break
                    }
                    for (const stepFile of stepFiles) {
                        await fileService.save({
                            fileId: stepFile.id,
                            projectId: stepFile.projectId,
                            type: FileType.FLOW_STEP_FILE,
                            fileName: stepFile.name,
                            compression: FileCompression.NONE,
                            data: stepFile.data,
                            size: stepFile.data.length,
                            metadata: {
                                flowId: stepFile.flowId,
                                stepName: stepFile.stepName,
                            },
                        })
                        await queryRunner.query(
                            `DELETE FROM step_file WHERE id = '${stepFile.id}'`,
                        )
                    }
                    logger.info({
                        filesMigrated: stepFiles.length,
                    }, 'step files migrated, continuing')
                }
                logger.info('step files migrated, done')
            }
            finally {
                await queryRunner.release()
            }
        }
        finally {
            if (lock) {
                await lock.release()
            }
        }
    },
}