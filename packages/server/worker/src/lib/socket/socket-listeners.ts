import { PiecePackage, WebsocketWorkerEvent } from "@activepieces/shared";
import { FastifyBaseLogger } from "fastify";
import { appSocket } from "../app-socket";
import { registryPieceManager } from "../cache/pieces/production/registry-piece-manager";

export const socketListeners = (log: FastifyBaseLogger) => ({
    init: async (): Promise<void> => {
        await socketListeners(log).onPiecesInstalled()
    },
    onPiecesInstalled: async (): Promise<void> => {
        appSocket(log).addListener<PiecesInstalledEventData>(WebsocketWorkerEvent.PIECES_INSTALLED, async (data) => {
            const { pieces } = data
            await registryPieceManager(log).install({
              pieces,
              includeFilters: false,
              broadcast: false
            })
        })
    }
})

type PiecesInstalledEventData = {
  pieces: PiecePackage[]
}