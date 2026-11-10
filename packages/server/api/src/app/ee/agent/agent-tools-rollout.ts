import { ApEnvironment } from '@activepieces/shared'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'

function isOn(): boolean {
    return system.get(AppSystemProp.ENVIRONMENT) === ApEnvironment.DEVELOPMENT
}

export const agentToolsRollout = {
    isOn,
}
