import { FastifyBaseLogger } from 'fastify'
import { OnPieceCreatedParams, PieceHooks } from '../../pieces/piece-hooks'
import { pieceSetService } from './piece-set/piece-set.service'

export const enterprisePieceHooks = (log: FastifyBaseLogger): PieceHooks => ({
    async onPieceCreated(params: OnPieceCreatedParams): Promise<void> {
        await pieceSetService(log).handleNewPieceInstalled(params)
    },
})
