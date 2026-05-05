import fs from 'fs/promises'
import { logger } from './config/logger'

const SPOOL_BASE_DIR = process.env['AP_FLOW_RUN_LOG_SPOOL_DIR'] ?? '/tmp/ap-runs'

export const spoolJanitor = {
    async sweepOnBoot(): Promise<void> {
        const { data: entries, error: readError } = await readDirSafe(SPOOL_BASE_DIR)
        if (readError) {
            logger.warn({ error: readError, dir: SPOOL_BASE_DIR }, 'Spool janitor: skipping sweep, base dir unreadable')
            return
        }
        if (entries.length === 0) {
            return
        }
        logger.info({ count: entries.length, dir: SPOOL_BASE_DIR }, 'Spool janitor: sweeping stale run directories')
        await Promise.all(entries.map(async (name) => {
            const dirPath = `${SPOOL_BASE_DIR}/${name}`
            await fs.rm(dirPath, { recursive: true, force: true }).catch((err: unknown) => {
                logger.warn({ error: err, dirPath }, 'Spool janitor: failed to delete stale dir')
            })
        }))
    },
}

async function readDirSafe(dir: string): Promise<{ data: string[], error: null } | { data: never[], error: unknown }> {
    try {
        const items = await fs.readdir(dir)
        return { data: items, error: null }
    }
    catch (error) {
        return { data: [], error }
    }
}
