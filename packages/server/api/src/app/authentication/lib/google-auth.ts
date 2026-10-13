import { isNil } from '@activepieces/core-utils'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'

export const googleAuth = {
    isConfigured(): boolean {
        return !isNil(system.get(AppSystemProp.GOOGLE_CLIENT_ID)) && !isNil(system.get(AppSystemProp.GOOGLE_CLIENT_SECRET))
    },
}
