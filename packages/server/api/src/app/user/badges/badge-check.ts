import { BADGES } from '@activepieces/shared'
import { AuditEventParam, MetaInformation } from '../../helper/application-events'

export type BadgeCheck = {
    eval: (params: {
        requestInformation: MetaInformation
        event: AuditEventParam
    }) => Promise<(keyof typeof BADGES)[]>
}
