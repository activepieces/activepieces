import { isNil } from '@activepieces/core-utils'
import { AUDIT_LOG_RETENTION_MAX_DAYS } from '@activepieces/shared'
import { system } from '../system/system'
import { AppSystemProp } from '../system/system-props'

function get(): number | null {
    return parse(system.get(AppSystemProp.AUDIT_LOG_RETENTION_DAYS))
}

function parse(value: string | undefined): number | null {
    if (isNil(value) || !WHOLE_DAYS_PATTERN.test(value)) {
        return null
    }
    const days = Number(value)
    return days >= 1 && days <= AUDIT_LOG_RETENTION_MAX_DAYS ? days : null
}

export const auditLogRetentionCeiling = { get, parse }

const WHOLE_DAYS_PATTERN = /^\d+$/
