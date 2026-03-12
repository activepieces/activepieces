/* eslint-disable @typescript-eslint/no-explicit-any */
import { Readable } from 'stream'
import { AppSystemProp } from '@activepieces/server-common'
import { S3 } from '@aws-sdk/client-s3'
import { customAlphabet } from 'nanoid'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const generateId = customAlphabet(ALPHABET, 21)

const FILE_STORAGE_LOCATION = system.get<string>(AppSystemProp.FILE_STORAGE_LOCATION) ?? 'DB'

const BATCH_SIZE = 100

type MigrateContext = {
    queryRunner: QueryRunner
    flowVersionId: string
    flowId: string
    projectId: string
}

async function migrateSteps(
    params: { step: any } & MigrateContext,
): Promise<{ updated: boolean, trigger: any }> {
    const { step, queryRunner, flowVersionId, flowId, projectId } = params
    if (!step) {
        return { updated: false, trigger: step }
    }

    let updated = false
    let current: any = JSON.parse(JSON.stringify(step))

    const migratedStep = await migrateStep({ step: current, queryRunner, flowVersionId, flowId, projectId })
    if (migratedStep !== null) {
        current = migratedStep
        updated = true
    }

    if (current.type === 'ROUTER' && Array.isArray(current.children)) {
        const newChildren: any[] = []
        let childrenUpdated = false
        for (const child of current.children) {
            if (child) {
                const result = await migrateSteps({ step: child, queryRunner, flowVersionId, flowId, projectId })
                newChildren.push(result.trigger)
                if (result.updated) {
                    childrenUpdated = true
                }
            }
            else {
                newChildren.push(child)
            }
        }
        if (childrenUpdated) {
            current = { ...current, children: newChildren }
            updated = true
        }
    }

    if (current.type === 'LOOP_ON_ITEMS' && current.firstLoopAction) {
        const result = await migrateSteps({ step: current.firstLoopAction, queryRunner, flowVersionId, flowId, projectId })
        if (result.updated) {
            current = { ...current, firstLoopAction: result.trigger }
            updated = true
        }
    }

    if (current.nextAction) {
        const result = await migrateSteps({ step: current.nextAction, queryRunner, flowVersionId, flowId, projectId })
        if (result.updated) {
            current = { ...current, nextAction: result.trigger }
            updated = true
        }
    }

    return { updated, trigger: current }
}

async function migrateStep(params: { step: any } & MigrateContext): Promise<any> {
    const { step, queryRunner, flowVersionId, flowId, projectId } = params
    const inputUiInfo = step.settings?.inputUiInfo
    if (!inputUiInfo) {
        return null
    }

    const currentSelectedData = inputUiInfo.currentSelectedData
    if (currentSelectedData === undefined || currentSelectedData === null) {
        return null
    }

    const sharedMetadata = {
        flowId,
        flowVersionId,
        stepName: step.name,
        dataType: 'JSON',
    }

    let sampleDataFileId = inputUiInfo.sampleDataFileId
    if (!sampleDataFileId) {
        const outputJson = typeof currentSelectedData === 'string' ? currentSelectedData : JSON.stringify(currentSelectedData)
        const outputBuffer = Buffer.from(outputJson, 'utf-8')
        sampleDataFileId = generateId()

        let useDbStorage = FILE_STORAGE_LOCATION !== 'S3'

        if (FILE_STORAGE_LOCATION === 'S3') {
            const s3Key = `project/${projectId}/SAMPLE_DATA/${sampleDataFileId}`
            try {
                await uploadToS3(s3Key, outputBuffer)
                await queryRunner.query(
                    `INSERT INTO "file" ("id", "created", "updated", "projectId", "type", "compression", "location", "data", "size", "s3Key", "metadata")
                     VALUES ($1, NOW(), NOW(), $2, 'SAMPLE_DATA', 'NONE', 'S3', NULL, $3, $4, $5)`,
                    [sampleDataFileId, projectId, outputBuffer.length, s3Key, JSON.stringify(sharedMetadata)],
                )
            }
            catch (error) {
                log.warn({
                    error,
                    flowVersionId,
                    stepName: step.name,
                }, 'MigrateSampleDataToFiles1739600000000: S3 upload failed, falling back to database storage')
                useDbStorage = true
            }
        }

        if (useDbStorage) {
            await queryRunner.query(
                `INSERT INTO "file" ("id", "created", "updated", "projectId", "type", "compression", "location", "data", "size", "metadata")
                 VALUES ($1, NOW(), NOW(), $2, 'SAMPLE_DATA', 'NONE', 'DB', $3, $4, $5)`,
                [sampleDataFileId, projectId, outputBuffer, outputBuffer.length, JSON.stringify(sharedMetadata)],
            )
        }

        log.info({
            sampleDataFileId,
            flowVersionId,
            flowId,
            stepName: step.name,
            location: useDbStorage ? 'DB' : 'S3',
        }, 'MigrateSampleDataToFiles1739600000000: created sample data file')
    }

    return {
        ...step,
        settings: {
            ...step.settings,
            inputUiInfo: {
                ...inputUiInfo,
                sampleDataFileId,
            },
        },
    }
}

let s3Client: S3 | null = null

function getS3Client(): S3 {
    if (s3Client) {
        return s3Client
    }
    const useIRSA = system.getBoolean(AppSystemProp.S3_USE_IRSA)
    const region = system.get<string>(AppSystemProp.S3_REGION)
    const endpoint = system.get<string>(AppSystemProp.S3_ENDPOINT)

    s3Client = new S3({
        region,
        forcePathStyle: endpoint ? true : undefined,
        endpoint,
        ...(!useIRSA && {
            credentials: {
                accessKeyId: system.getOrThrow<string>(AppSystemProp.S3_ACCESS_KEY_ID),
                secretAccessKey: system.getOrThrow<string>(AppSystemProp.S3_SECRET_ACCESS_KEY),
            },
        }),
    })
    return s3Client
}

async function uploadToS3(s3Key: string, data: Buffer): Promise<void> {
    const bucket = system.getOrThrow<string>(AppSystemProp.S3_BUCKET)
    const client = getS3Client()

    await client.putObject({
        Bucket: bucket,
        Key: s3Key,
        Body: Readable.from(data),
        ContentLength: data.length,
    })
}

export class MigrateSampleDataToFiles1739600000000 implements MigrationInterface {
    name = 'MigrateSampleDataToFiles1739600000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        let offset = 0
        let totalProcessed = 0
        let updatedFlows = 0

        while (true) {
            const flowVersionRows: { id: string, trigger: any, flowId: string, projectId: string }[] =
                await queryRunner.query(
                    `
                SELECT fv.id, fv.trigger, fv."flowId", f."projectId"
                FROM flow_version fv
                JOIN flow f ON fv."flowId" = f.id
                WHERE CAST(fv.trigger AS TEXT) LIKE '%currentSelectedData%'
                ORDER BY fv.id
                LIMIT $1 OFFSET $2
            `,
                    [BATCH_SIZE, offset],
                )

            if (flowVersionRows.length === 0) {
                break
            }

            log.info({
                batch: Math.floor(offset / BATCH_SIZE) + 1,
                batchSize: flowVersionRows.length,
                offset,
            }, 'MigrateSampleDataToFiles1739600000000: processing batch')

            for (const row of flowVersionRows) {
                const trigger = typeof row.trigger === 'string' ? JSON.parse(row.trigger) : row.trigger
                const { updated, trigger: updatedTrigger } = await migrateSteps({
                    step: trigger,
                    queryRunner,
                    flowVersionId: row.id,
                    flowId: row.flowId,
                    projectId: row.projectId,
                })
                if (updated) {
                    await queryRunner.query(
                        'UPDATE flow_version SET trigger = $1 WHERE id = $2',
                        [JSON.stringify(updatedTrigger), row.id],
                    )
                    updatedFlows++
                }
            }

            totalProcessed += flowVersionRows.length
            offset += BATCH_SIZE
        }

        log.info({
            totalProcessed,
            updatedFlows,
        }, 'MigrateSampleDataToFiles1739600000000: migration complete')
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // No rollback: migrated data remains in the file table; the inline
        // currentSelectedData field is not restored.
    }
}
