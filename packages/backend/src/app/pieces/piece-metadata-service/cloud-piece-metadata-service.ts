import { PieceMetadataModel, PieceMetadataModelSummary, PieceMetadataSchema } from '../piece-metadata-entity'
import { PieceMetadataService } from './piece-metadata-service'
import { AllPiecesStats, pieceStatsService } from './piece-stats-service'
import { StatusCodes } from 'http-status-codes'
import { ActivepiecesError, EXACT_VERSION_PATTERN, ErrorCode } from '@activepieces/shared'
import { pieceMetadataServiceHooks } from './hooks'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cwd } from 'node:process'

const CLOUD_API_URL = 'https://cloud.activepieces.com/api/v1/pieces'

const handleHttpErrors = async (response: Response): Promise<void> => {
    if (response.status === StatusCodes.NOT_FOUND.valueOf()) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                message: 'piece not found',
            },
        })
    }

    if (response.status !== StatusCodes.OK.valueOf()) {
        throw new Error(await response.text())
    }
}

export const CloudPieceMetadataService = (): PieceMetadataService => {
    return {
        async list({ release, platformId, includeHidden }): Promise<PieceMetadataModelSummary[]> {
            const response = await fetch(`${CLOUD_API_URL}?release=${release}`)

            await handleHttpErrors(response)

            return pieceMetadataServiceHooks.get().filterPieces({
                includeHidden,
                pieces: (await response.json() as PieceMetadataModelSummary[]),
                platformId,
            })
        },

        async getOrThrow({ name, version, language }): Promise<PieceMetadataModel> {
            const response = await fetch(`${CLOUD_API_URL}/${name}${version ? '?version=' + version : ''}`)

            await handleHttpErrors(response)

            const jsonResponse = await response.json()

            const translations = loadTranslationsSync(jsonResponse.name.replace('@activepieces/piece-', ''), language ?? 'en')

            if (translations != null) {
                const translatedPieceMetadata = applyTranslationsToPieceMetadataModel(jsonResponse, translations)

                return translatedPieceMetadata
            }

            return jsonResponse as PieceMetadataModel
        },

        async create(): Promise<PieceMetadataSchema> {
            throw new Error('operation not supported')
        },

        async delete(): Promise<void> {
            throw new Error('operation not supported')
        },

        async stats(): Promise<AllPiecesStats> {
            return pieceStatsService.get()
        },

        async getExactPieceVersion({ name, version, projectId }): Promise<string> {
            const isExactVersion = EXACT_VERSION_PATTERN.test(version)

            if (isExactVersion) {
                return version
            }

            const pieceMetadata = await this.getOrThrow({
                projectId,
                name,
                version,
            })

            return pieceMetadata.version
        },
    }
}

const loadTranslationsSync = (pieceName: string, languageCode: string): Record<string, string> | null => {
    try {
        const translationsPath = join(cwd(), 'dist', 'packages', 'pieces', pieceName, 'translations', `${languageCode}.json`)
        const translationsContent = readFileSync(translationsPath, 'utf8')
        return JSON.parse(translationsContent)
    }
    catch (error) {
        return null
    }
}

const applyTranslationsToPieceMetadataModel = (pieceMetadata: PieceMetadataModel, translations: Record<string, string>): PieceMetadataModel => {
    if (translations[pieceMetadata.displayName]) {
        pieceMetadata.displayName = translations[pieceMetadata.displayName]
    }

    if (pieceMetadata.auth && translations[pieceMetadata.auth.displayName]) {
        pieceMetadata.auth.displayName = translations[pieceMetadata.auth.displayName]
    }

    Object.keys(pieceMetadata.actions).forEach(actionKey => {
        const action = pieceMetadata.actions[actionKey]

        if (translations[action.displayName]) {
            action.displayName = translations[action.displayName]
        }

        if (translations[action.description]) {
            action.description = translations[action.description]
        }

        Object.keys(action.props).forEach(propKey => {
            const prop = action.props[propKey]

            if (translations[prop.displayName]) {
                prop.displayName = translations[prop.displayName]
            }

            if (prop.description && translations[prop.description]) {
                prop.description = translations[prop.description]
            }
        })
    })

    return pieceMetadata
}
