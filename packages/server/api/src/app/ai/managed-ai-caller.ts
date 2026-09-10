import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/core-utils'
import { AI_PIECE_COST_BILLING_VERSION, AI_PIECE_NAME } from '@activepieces/shared'

function assertReportsCost({ pieceVersion }: AssertReportsCostParams): void {
    if (!isNil(pieceVersion) && pieceVersion.length > 0) {
        return
    }
    throw new ActivepiecesError({
        code: ErrorCode.VALIDATION,
        params: {
            message: `The Activepieces AI provider requires ${AI_PIECE_NAME} ${AI_PIECE_COST_BILLING_VERSION} or newer, because older versions cannot report what a call costs. Republish this flow to pick up the current version.`,
        },
    })
}

export const managedAiCaller = { assertReportsCost }

type AssertReportsCostParams = {
    pieceVersion?: string
}
