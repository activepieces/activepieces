import { isNil } from '@activepieces/core-utils'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'

export const signInMethodUtils = {
    isGoogleConfigured,
}

function isGoogleConfigured(): boolean {
    return isSet(system.get(AppSystemProp.GOOGLE_CLIENT_ID))
        && isSet(system.get(AppSystemProp.GOOGLE_CLIENT_SECRET))
}

function isSet(value: string | undefined): boolean {
    return !isNil(value) && value.trim().length > 0
}
