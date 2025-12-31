import { AuditEventParam, MetaInformation } from '../../../helper/application-events'

export type BadgeDefinition = {
    name: string
    eval: (params: {
        requestInformation: MetaInformation
        event: AuditEventParam
    }) => boolean
}

