import { AiUsageCharge } from '@activepieces/shared'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'

export function chargeFor({ usage, toolCalls = 0 }: { usage: AiUsageCharge, toolCalls?: number }): number {
    return creditsForModelCall(usage) + toolCalls * CREDITS_PER_TOOL_CALL
}

function creditsForModelCall(usage: AiUsageCharge): number {
    if (usage.type === 'flat-credits') {
        return usage.credits
    }
    return usage.costUsd / dollarsPerCredit()
}

export function costBasisOf(usage: AiUsageCharge): CostBasis | undefined {
    if (usage.type !== 'observed-cost') {
        return undefined
    }
    return { costUsd: usage.costUsd, creditUsdValue: dollarsPerCredit() }
}

function dollarsPerCredit(): number {
    const value = system.getDecimalOrThrow(AppSystemProp.AI_CREDIT_USD_VALUE)
    if (value <= 0) {
        throw new Error(`AP_${AppSystemProp.AI_CREDIT_USD_VALUE} must be greater than zero, so a call cannot bill an unbounded number of credits`)
    }
    return value
}

const CREDITS_PER_TOOL_CALL = 1

export type CostBasis = {
    costUsd: number
    creditUsdValue: number
}
