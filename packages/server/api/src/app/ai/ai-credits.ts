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
    return usage.costUsd / system.getNumberOrThrow(AppSystemProp.AI_CREDIT_USD_VALUE)
}

const CREDITS_PER_TOOL_CALL = 1
