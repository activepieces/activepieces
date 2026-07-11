import { ApEdition } from '@activepieces/shared'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'

function isReferralDevMode(): boolean {
    return system.getBoolean(AppSystemProp.REFERRAL_DEV_ENABLED) === true
}

function isReferralEnabled(): boolean {
    return system.getEdition() === ApEdition.CLOUD || isReferralDevMode()
}

export const referralUtils = {
    isReferralEnabled,
    isReferralDevMode,
}
