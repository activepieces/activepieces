import { isNil, tryCatch } from '@activepieces/core-utils'
import { apDayjs } from '@activepieces/server-utils'
import { FastifyBaseLogger } from 'fastify'
import { databaseConnection } from '../database/database-connection'
import { distributedLock } from '../database/redis-connections'
import { EncryptedObject, encryptUtils } from './encryption'
import { sleep } from './sleep'
import { SystemJobName } from './system-jobs/common'
import { systemJobHandlers } from './system-jobs/job-handlers'
import { systemJobsSchedule } from './system-jobs/system-job'

export const reencryptSecretsJob = (log: FastifyBaseLogger) => ({
    register(): void {
        systemJobHandlers.registerJobHandler(SystemJobName.REENCRYPT_SECRETS, async () => {
            await distributedLock(log).runExclusive({
                key: REENCRYPT_LOCK_KEY,
                timeoutInSeconds: REENCRYPT_LOCK_TIMEOUT_SECONDS,
                fn: async () => reencryptAllSecrets(log),
            })
        })
    },

    async enqueue(): Promise<void> {
        await systemJobsSchedule(log).upsertJob({
            job: {
                name: SystemJobName.REENCRYPT_SECRETS,
                data: {},
                jobId: REENCRYPT_JOB_ID,
            },
            schedule: {
                type: 'one-time',
                date: apDayjs(),
            },
        })
    },
})

export async function reencryptAllSecrets(log: FastifyBaseLogger): Promise<void> {
    log.info('[reencryptSecretsJob] Starting legacy CBC → GCM re-encryption sweep')
    for (const target of SWEEP_TARGETS) {
        const { error } = await tryCatch(() => reencryptTable(target, log))
        if (isNil(error)) {
            continue
        }
        if (pgErrorCode(error) === UNDEFINED_TABLE_ERROR) {
            log.info({ table: target.table }, '[reencryptSecretsJob] Table not present in this edition — skipping')
            continue
        }
        log.error({ error, table: target.table }, '[reencryptSecretsJob] Table sweep failed — continuing with remaining tables')
    }
    log.info('[reencryptSecretsJob] Legacy CBC → GCM re-encryption sweep finished')
}

async function reencryptTable(target: SweepTarget, log: FastifyBaseLogger): Promise<void> {
    const table = `"${target.table}"`
    const column = `"${target.blobColumn}"`
    const conditions = ['"id" > $1', `${column} IS NOT NULL`, `${column}->>'authTag' IS NULL`]
    if (!isNil(target.extraWhere)) {
        conditions.push(target.extraWhere)
    }
    const selectSql = `SELECT "id", ${column} AS blob FROM ${table} WHERE ${conditions.join(' AND ')} ORDER BY "id" LIMIT $2`
    const updateSql = `UPDATE ${table} SET ${column} = $1::${target.jsonType} WHERE "id" = $2 AND ${column}::jsonb = $3::jsonb`

    let lastId = ''
    let reencrypted = 0
    let failed = 0
    for (;;) {
        const rows: CbcRow[] = await databaseConnection().query(selectSql, [lastId, BATCH_SIZE])
        if (rows.length === 0) {
            break
        }
        for (const row of rows) {
            const { error } = await tryCatch(() => reencryptRow({ updateSql, row }))
            if (isNil(error)) {
                reencrypted++
                continue
            }
            failed++
            log.error({ error, table: target.table, id: row.id }, '[reencryptSecretsJob] Failed to re-encrypt row — leaving it as legacy CBC')
        }
        lastId = rows[rows.length - 1].id
        await sleep(PACING_DELAY_MS)
    }
    log.info({ table: target.table, reencrypted, failed }, '[reencryptSecretsJob] Table sweep complete')
}

// Conditional on the exact CBC blob we read (`${column}::jsonb = $3::jsonb`), not just `authTag IS NULL`:
// during the R1→R2 rollout a still-running R1 instance may write a fresh CBC value for the same row,
// and an `authTag IS NULL`-only guard would clobber it with our stale plaintext. The exact-match no-ops
// on any concurrent change; the straggler stays CBC and is caught by a later sweep once R1 is gone.
async function reencryptRow({ updateSql, row }: { updateSql: string, row: CbcRow }): Promise<void> {
    const plaintext = await encryptUtils.decryptString(row.blob)
    const reencrypted = await encryptUtils.encryptString(plaintext)
    await databaseConnection().query(updateSql, [JSON.stringify(reencrypted), row.id, JSON.stringify(row.blob)])
}

function pgErrorCode(error: unknown): string | undefined {
    if (typeof error !== 'object' || isNil(error)) {
        return undefined
    }
    if ('code' in error && typeof error.code === 'string') {
        return error.code
    }
    if ('driverError' in error && typeof error.driverError === 'object' && !isNil(error.driverError) && 'code' in error.driverError && typeof error.driverError.code === 'string') {
        return error.driverError.code
    }
    return undefined
}

const OIDC_PRIVATE_KEY_FLAG_ID = 'OIDC_RSA_PRIVATE_KEY'
const REENCRYPT_JOB_ID = 'reencrypt-secrets'
const REENCRYPT_LOCK_KEY = 'reencrypt-secrets'
const REENCRYPT_LOCK_TIMEOUT_SECONDS = 300
const BATCH_SIZE = 200
const PACING_DELAY_MS = 200
const UNDEFINED_TABLE_ERROR = '42P01'

// ponytail: full index scan per table on every boot until Release 3 removes this job — acceptable
// for a temporary migration; upgrade path is the R3 contract that deletes the sweep entirely.
const SWEEP_TARGETS: SweepTarget[] = [
    { table: 'app_connection', blobColumn: 'value', jsonType: 'jsonb' },
    { table: 'variable', blobColumn: 'value', jsonType: 'jsonb' },
    { table: 'ai_provider', blobColumn: 'auth', jsonType: 'json' },
    { table: 'ai_tool_config', blobColumn: 'auth', jsonType: 'json' },
    { table: 'oauth_app', blobColumn: 'clientSecret', jsonType: 'jsonb' },
    { table: 'secret_manager_connection', blobColumn: 'auth', jsonType: 'jsonb' },
    { table: 'flag', blobColumn: 'value', jsonType: 'jsonb', extraWhere: `"id" = '${OIDC_PRIVATE_KEY_FLAG_ID}'` },
]

type CbcRow = {
    id: string
    blob: EncryptedObject
}

type SweepTarget = {
    table: string
    blobColumn: string
    jsonType: 'json' | 'jsonb'
    extraWhere?: string
}
