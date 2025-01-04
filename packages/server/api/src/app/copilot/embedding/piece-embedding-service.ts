import { FastifyBaseLogger } from "fastify"
import { cosineSimilarity, embedMany } from 'ai'
import { openai } from '@ai-sdk/openai'
import { readFile, writeFile } from 'fs/promises';
import path, { join } from 'path'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'
import { flagService } from "../../flags/flag.service";
import { fileExists, memoryLock, threadSafeMkdir } from "@activepieces/server-shared";
import { PackageType, PieceType } from "@activepieces/shared";

const EMBEDDING_DIRECTORY = path.resolve('cache', 'embeddings')
const EMBEDDING_FILE = join(EMBEDDING_DIRECTORY, 'pieces.json')

export const pieceEmbeddingService = (log: FastifyBaseLogger) => {
    let initialized = false;

    return {
        async init() {
            const lock = await memoryLock.acquire('piece-embedding-service-init');
            try {
                const exists = await fileExists(EMBEDDING_FILE)
                if (exists) {
                    return;
                }
                log.info('[PieceEmbeddingService] Initializing')
                const pieces = await pieceMetadataService(log).list({
                    release: await flagService.getCurrentRelease(),
                    includeHidden: false,
                })
                const enrichedPieces = await Promise.all(pieces.map(async (piece) => {
                    return pieceMetadataService(log).getOrThrow({
                        name: piece.name,
                        version: piece.version,
                        projectId: undefined,
                        platformId: undefined,
                    })
                }))
                const segments: EmbeddingMetadata[] = []

                for (const piece of enrichedPieces) {
                    for (const [actionName, action] of Object.entries(piece.actions)) {
                        segments.push({
                            content: `Piece: ${piece.name}\nAction: ${action.displayName}\nDescription: ${action.description}`,
                            metadata: {
                                pieceName: piece.name,
                                type: 'action',
                                stepName: actionName,
                                pieceVersion: piece.version,
                                logoUrl: piece.logoUrl,
                                pieceType: piece.pieceType,
                                packageType: piece.packageType,
                            }
                        })
                    }
                    for (const [triggerName, trigger] of Object.entries(piece.triggers)) {
                        segments.push({
                            content: `Piece Display Name: ${piece.displayName}\nTrigger: ${trigger.displayName}\nDescription: ${trigger.description}`,
                            metadata: {
                                pieceName: piece.name,
                                type: 'trigger',
                                stepName: triggerName,
                                pieceVersion: piece.version,
                                logoUrl: piece.logoUrl,
                                pieceType: piece.pieceType,
                                packageType: piece.packageType,
                            }
                        })
                    }
                }
                log.info({
                    count: segments.length,
                }, '[PieceEmbeddingService] Embedding segments')

                const embeddedVectors: number[][] = await createEmbedVectorForText(segments.map(segment => segment.content))
                const embeddedChunks: EmbeddedChunk[] = segments.map((segment, index) => ({
                    ...segment,
                    embedding: embeddedVectors[index],
                }))
                const embeddingFile: EmbeddingFile = {
                    version: 'v1',
                    chunks: embeddedChunks,
                }
                await threadSafeMkdir(EMBEDDING_DIRECTORY)
                await writeFile(EMBEDDING_FILE, JSON.stringify(embeddingFile, null, 2))
                initialized = true;
                log.info('[PieceEmbeddingService] Initialized')
            } finally {
                lock.release();
            }
        },
        async search<T extends EmbeddingMetadata>(params: SearchParams): Promise<T | null> {
            if (!initialized) {
                await this.init();
            }
            const embeddingFile: EmbeddingFile = JSON.parse(await readFile(EMBEDDING_FILE, 'utf-8'))
            const chunks = embeddingFile.chunks
            const embedding = await createEmbedVectorForText([params.query])
            const chunksWithSimilarity = chunks
                .filter(chunk => chunk.metadata.type === params.type)
                .map(chunk => ({
                    ...chunk,
                    similarity: cosineSimilarity(embedding[0], chunk.embedding),
                }))
                .sort((a, b) => b.similarity - a.similarity)
            const highestSimilarityChunk = chunksWithSimilarity.find(chunk => chunk.similarity > 0.6) ?? null
            return highestSimilarityChunk as unknown as T | null
        }
    }
}


async function createEmbedVectorForText(text: string[]): Promise<number[][]> {
    const embeddingModel = openai.embedding('text-embedding-3-small')
    const { embeddings } = await embedMany({
        model: embeddingModel,
        values: text,
    })
    return embeddings
}

type SearchParams = {
    query: string
    type: 'action' | 'trigger'
}

type EmbeddingFile = {
    version: 'v1'
    chunks: EmbeddedChunk[]
}

type ActionEmbeddingMetadata = {
    content: string
    metadata: {
        pieceName: string
        type: 'action'
        stepName: string
        pieceVersion: string
        pieceType: PieceType
        packageType: PackageType
        logoUrl: string
    }
}
type TriggerEmbeddingMetadata = {
    content: string
    metadata: {
        pieceName: string
        type: 'trigger'
        stepName: string
        pieceVersion: string
        pieceType: PieceType
        packageType: PackageType
        logoUrl: string
    }
}
type EmbeddingMetadata = ActionEmbeddingMetadata | TriggerEmbeddingMetadata

type EmbeddedChunk = EmbeddingMetadata & {
    embedding: number[]
}