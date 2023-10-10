import { logger } from '../../helper/logger'
import { acquireLock } from '../../helper/lock'
import { connectionsLimits } from '../billing/usage/limits/connections-limits'
import { AppConnectionHooks } from '../../app-connection/app-connection-service/app-connection-hooks'

export const cloudAppConnectionsHooks: AppConnectionHooks = {
    async preUpsert({ projectId }: { projectId: string }): Promise<void> {
        const lock = await acquireLock({
            key: `${projectId}-connection-limit`,
            timeout: 20000,
        })

        try {
            await connectionsLimits.limitConnections({ projectId })
        }
        catch (e) {
            logger.error(e, '[CloudAppConnectionService#preUpsertHook] error')
            throw e
        }
        finally {
            await lock.release()
        }
    },
}
