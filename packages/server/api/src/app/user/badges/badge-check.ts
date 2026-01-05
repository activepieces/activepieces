import { BADGES } from '@activepieces/shared'
import { AuditEventParam, MetaInformation } from '../../helper/application-events'

export type BadgeCheckResult = {
    userId: string | null
    badges: (keyof typeof BADGES)[]
}

export type BadgeCheck = {
    eval: (params: {
        requestInformation: MetaInformation
        event: AuditEventParam
    }) => Promise<BadgeCheckResult>
}
