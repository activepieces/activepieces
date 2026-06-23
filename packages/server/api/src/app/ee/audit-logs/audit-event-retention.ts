import { execFile } from 'node:child_process'
import { gzipSync } from 'node:zlib'
import { promisify } from 'node:util'
import { apId, tryCatch } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { s3Helper } from '../../file/s3-helper'
import { exceptionHandler } from '../../helper/exception-handler'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { auditLogRepo } from './audit-event-service'

const execFileAsync = promisify(execFile)

export const auditEventRetention = (log: FastifyBaseLogger) => ({
    async archiveAndPrune(): Promise<void> {
        const cutoff = dayjs().subtract(RETENTION_DAYS, 'days').toISOString()
        let archived = 0
        for (;;) {
            const batch = await auditLogRepo().createQueryBuilder('audit_event')
                .where('audit_event.created < :cutoff', { cutoff })
                .orderBy('audit_event.created', 'ASC')
                .limit(ARCHIVE_BATCH_SIZE)
                .getMany()
            if (batch.length === 0) {
                break
            }
            await archiveBatchToS3({ rows: batch, log })
            await auditLogRepo().delete({ id: In(batch.map((row) => row.id)) })
            archived += batch.length
            log.info({ archived }, '[auditEventRetention] archived and deleted batch')
        }
        if (archived === 0) {
            log.info('[auditEventRetention] no audit events older than retention window')
            return
        }
        await repackAuditEventTable(log)
    },
})

async function archiveBatchToS3({ rows, log }: ArchiveBatchParams): Promise<void> {
    const ndjson = rows.map((row) => JSON.stringify(row)).join('\n')
    const body = gzipSync(Buffer.from(ndjson, 'utf-8'))
    const key = `${ARCHIVE_PREFIX}/${dayjs().format('YYYY/MM/DD')}/${apId()}.ndjson.gz`
    await s3Helper(log).uploadFile(key, body)
}

// pg_repack reclaims disk after the bulk DELETE. It is best-effort: the rows are
// already safely in S3 and removed from PG, so a repack failure must not retry the job.
async function repackAuditEventTable(log: FastifyBaseLogger): Promise<void> {
    const { error } = await tryCatch(async () => {
        await auditLogRepo().query('CREATE EXTENSION IF NOT EXISTS pg_repack')
        await runPgRepack()
    })
    if (error) {
        log.error({ error }, '[auditEventRetention] pg_repack failed; disk space not reclaimed')
        exceptionHandler.handle(error, log)
    }
}

async function runPgRepack(): Promise<void> {
    const args = ['--no-superuser-check', '--table', AUDIT_EVENT_TABLE]
    const env = { ...process.env }
    const url = system.get<string>(AppSystemProp.POSTGRES_URL)
    if (url) {
        args.push('--dbname', url)
    }
    else {
        args.push(
            '--host', system.getOrThrow<string>(AppSystemProp.POSTGRES_HOST),
            '--port', system.getOrThrow<string>(AppSystemProp.POSTGRES_PORT),
            '--username', system.getOrThrow<string>(AppSystemProp.POSTGRES_USERNAME),
            '--dbname', system.getOrThrow<string>(AppSystemProp.POSTGRES_DATABASE),
        )
        env.PGPASSWORD = system.getOrThrow<string>(AppSystemProp.POSTGRES_PASSWORD)
    }
    await execFileAsync('pg_repack', args, { env })
}

type ArchiveBatchParams = {
    rows: { id: string }[]
    log: FastifyBaseLogger
}

const RETENTION_DAYS = 90
const ARCHIVE_BATCH_SIZE = 5000
const ARCHIVE_PREFIX = 'audit-archive'
const AUDIT_EVENT_TABLE = 'audit_event'
