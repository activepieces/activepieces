import { AuditEventParam, MetaInformation } from '../../helper/application-events'

export type BadgeCheck = {
    name: string
    eval: (params: {
        requestInformation: MetaInformation
        event: AuditEventParam
    }) => Promise<boolean>
}

