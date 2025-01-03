import { FastifyBaseLogger } from "fastify"
import { cosineSimilarity, embedMany } from 'ai'
import { openai } from '@ai-sdk/openai'
import fs from 'fs';
import path, { join } from 'path'
import { PieceMetadataModel } from '@activepieces/pieces-framework'
import { pieceMetadataService } from '../../pieces/piece-metadata-service'


type EmbeddingSegmentType = 'piece' | 'action' | 'trigger'

interface EmbeddingSegment {
    content: string
    metadata: {
        pieceName: string
        type: EmbeddingSegmentType
        name: string
        logoUrl?: string
    }
}

interface EmbeddedPiece {
    metadata: {
        pieceName: string
        logoUrl?: string
    }
    content: string
    embedding: number[]
}

interface PieceMetadataWithScore extends PieceMetadataModel {
    relevanceScore: number
}

interface SearchParams {
    prompt: string
    threshold?: number
}

// Configuration
const EMBEDDINGS_DIR = path.join(
    process.cwd(),
    'dist',
    'packages',
    'server',
    'api',
    'embeddings'
);
const EMBEDDING_MODEL = openai.embedding('text-embedding-3-small')
const DEFAULT_THRESHOLD = 0.35

const createSegmentFromPiece = (piece: PieceMetadataModel): EmbeddingSegment => ({
    content: `${piece.displayName}: ${piece.description}`,
    metadata: {
        pieceName: piece.name,
        type: 'piece',
        name: piece.name,
        logoUrl: piece.logoUrl,
    }
})

const createSegmentFromAction = (piece: PieceMetadataModel, [actionName, action]: [string, any]): EmbeddingSegment => ({
    content: `${action.displayName}: ${action.description}`,
    metadata: {
        pieceName: piece.name,
        type: 'action',
        name: actionName,
        logoUrl: piece.logoUrl,
    }
})

const createSegmentFromTrigger = (piece: PieceMetadataModel, [triggerName, trigger]: [string, any]): EmbeddingSegment => ({
    content: `${trigger.displayName}: ${trigger.description}`,
    metadata: {
        pieceName: piece.name,
        type: 'trigger',
        name: triggerName,
        logoUrl: piece.logoUrl,
    }
})

const createEmbeddingSegments = (pieces: PieceMetadataModel[]): EmbeddingSegment[] => 
    pieces.flatMap(piece => [
        createSegmentFromPiece(piece),
        ...Object.entries(piece.actions || {}).map(action => createSegmentFromAction(piece, action)),
        ...Object.entries(piece.triggers || {}).map(trigger => createSegmentFromTrigger(piece, trigger))
    ])

const calculateSimilarityScores = (queryEmbedding: number[], pieces: EmbeddedPiece[], threshold: number) =>
    pieces
        .map(piece => ({
            piece,
            score: cosineSimilarity(queryEmbedding, piece.embedding),
        }))
        .filter(({ score }) => score >= threshold)
        .sort((a, b) => b.score - a.score)
        .filter((scored, index, array) => 
            array.findIndex(s => s.piece.metadata.pieceName === scored.piece.metadata.pieceName) === index
        )


export const pieceEmbeddingService = (log: FastifyBaseLogger) => {
    let piecesEmbeddings: EmbeddedPiece[] = []

    const checkEmbeddingsExist = (): boolean => {
        const embeddingsPath = path.join(EMBEDDINGS_DIR, 'pieces-embeddings.json')
        return fs.existsSync(embeddingsPath)
    }

    const checkAndGenerateEmbeddings = async (): Promise<void> => {
        log.info('Checking if embeddings file exists...')
        try {
            const embeddingsExist = checkEmbeddingsExist()
            log.info({ embeddingsExist }, 'Embeddings file exists')
            if (!embeddingsExist) {
                log.info('Embeddings file not found, generating embeddings...')
                await generateEmbeddings()
            }
        } catch (error) {
            log.error({ error }, 'Failed to check or generate embeddings')
            throw new Error('Failed to check or generate embeddings')
        }
    }

    const createEmbedding = async (text: string): Promise<number[]> => {
        try {
            const { embeddings } = await embedMany({
                model: EMBEDDING_MODEL,
                values: [text],
            })
            return embeddings[0]
        } catch (error) {
            log.error({ error }, 'Failed to create embedding')
            throw new Error('Failed to create embedding')
        }
    }

    const find = async ({ prompt, threshold = DEFAULT_THRESHOLD }: SearchParams): Promise<PieceMetadataWithScore[]> => {
        try {
            if (piecesEmbeddings.length === 0) {
                await loadEmbeddings()
            }

            const queryEmbedding = await createEmbedding(prompt)
            const scoredPieces = calculateSimilarityScores(queryEmbedding, piecesEmbeddings, threshold)

            return Promise.all(
                scoredPieces.map(async ({ piece, score }) => ({
                    ...(await pieceMetadataService(log).getOrThrow({
                        name: piece.metadata.pieceName,
                        version: 'latest',
                        projectId: undefined,
                        platformId: undefined,
                    })),
                    relevanceScore: score,
                }))
            )
        } catch (error) {
            log.error({ error }, 'Piece search failed')
            throw new Error('Failed to find relevant pieces')
        }
    }

    const loadEmbeddings = async (): Promise<void> => {
        try {
            const embeddingsPath = path.join(EMBEDDINGS_DIR, 'pieces-embeddings.json')
            const embeddingsData = fs.readFileSync(embeddingsPath, 'utf-8')
            piecesEmbeddings = JSON.parse(embeddingsData)
        } catch (error) {
            log.error({ error }, 'Failed to load pieces embeddings')
            throw new Error('Failed to load pieces embeddings')
        }
    }

    const generateEmbeddings = async (): Promise<void> => {
        try {
            fs.mkdirSync(EMBEDDINGS_DIR, { recursive: true })
            const outputPath = join(EMBEDDINGS_DIR, 'pieces-embeddings.json')

            fs.writeFileSync(outputPath, JSON.stringify([], null, 2))
            log.info('Fetching pieces metadata...')
            const summaries = await pieceMetadataService(log).list({
                release: 'latest',
                includeHidden: false,
            })
            const pieces = await Promise.all(
                summaries.map(summary => 
                    pieceMetadataService(log).getOrThrow({
                        name: summary.name,
                        version: summary.version,
                        projectId: undefined,
                        platformId: undefined,
                    })
                )
            )

            log.info('Creating embedding segments...')
            const segments = createEmbeddingSegments(pieces)

            log.info('Generating embeddings...')
            const { embeddings } = await embedMany({
                model: EMBEDDING_MODEL,
                values: segments.map(segment => segment.content),
            })

            const embeddedData = segments.map((segment, index) => ({
                ...segment,
                embedding: embeddings[index],
            }))

            fs.writeFileSync(outputPath, JSON.stringify(embeddedData, null, 2))
            log.info(`Embeddings saved to ${outputPath}`)

            piecesEmbeddings = embeddedData
        } catch (error) {
            log.error({ error }, 'Failed to generate embeddings')
            throw new Error('Failed to generate embeddings')
        }
    }

    return {
        find,
        generateEmbeddings,
        loadEmbeddings,
        checkAndGenerateEmbeddings,
    }
}