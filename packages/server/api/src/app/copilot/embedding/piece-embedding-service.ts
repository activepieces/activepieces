import { FastifyBaseLogger } from "fastify"
import { pieceMetadataService } from "../../pieces/piece-metadata-service"
import { ApEdition } from "@activepieces/shared"


export const pieceEmbeddingService = (log: FastifyBaseLogger) => {
    return {
        save: async (pieceName: string, pieceVersion: string, triggerName: string): Promise<void> => {
            const pieces = await pieceMetadataService(log).list({
                release: 'latest',
                includeHidden: false,
            })
        }
    }
}