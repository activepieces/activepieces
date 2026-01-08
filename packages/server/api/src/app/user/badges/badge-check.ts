import { BADGES } from '@activepieces/shared'
import { AuditEventParam } from '../../helper/application-events'

export type BadgeCheckResult = {
    userId: string | null
    badges: (keyof typeof BADGES)[]
}

export type BadgeCheck = {
    eval: (params: {
        userId?: string
        event: AuditEventParam
    }) => Promise<BadgeCheckResult>
}
