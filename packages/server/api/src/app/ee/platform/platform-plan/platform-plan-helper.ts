import { PRICE_ID_MAP, PRICE_NAMES } from '@activepieces/ee-shared'
import { AppSystemProp } from '@activepieces/server-shared'
import { system } from '../../../helper/system/system'

const stripeSecretKey = system.get(AppSystemProp.STRIPE_SECRET_KEY)

export const AI_CREDIT_PRICE_ID = getPriceIdFor(PRICE_NAMES.AI_CREDITS)
export const ACTIVE_FLOW_PRICE_ID = getPriceIdFor(PRICE_NAMES.ACTIVE_FLOWS)

export const PlatformPlanHelper = {
    
    
}

function getPriceIdFor(price: PRICE_NAMES): string {
    const isDev = stripeSecretKey?.startsWith('sk_test')
    const env = isDev ? 'dev' : 'prod'

    const entry = PRICE_ID_MAP[price]

    if (!entry) {
        throw new Error(`No price with the given price name '${price}' is available`)
    }

    return entry[env]
}