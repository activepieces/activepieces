import { hooksFactory } from '../helper/hooks-factory'

export type OnPieceCreatedParams = {
    platformId: string | undefined
    pieceName: string
    isNewPiece: boolean
    newActionNames: string[]
    newTriggerNames: string[]
}

export type PieceHooks = {
    onPieceCreated(params: OnPieceCreatedParams): Promise<void>
}

export const pieceHooks = hooksFactory.create<PieceHooks>(_log => ({
    async onPieceCreated(_params) {
        return
    },
}))
