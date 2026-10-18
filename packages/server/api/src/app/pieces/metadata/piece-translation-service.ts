import { isNil, LocalesEnum, sanitizeObjectForPostgresql } from '@activepieces/core-utils'
import { I18nForPiece } from '@activepieces/pieces-framework'
import { EntityManager } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { PieceMetadataEntity } from './piece-metadata-entity'
import { PieceTranslationEntity, PieceTranslationSchema } from './piece-translation-entity'

const pieceTranslationRepos = repoFactory(PieceTranslationEntity)

export const pieceTranslationService = {
    async save({ pieceMetadataId, i18n, entityManager }: SaveParams): Promise<void> {
        const rows = toRows({ pieceMetadataId, i18n })
        if (rows.length > 0) {
            await pieceTranslationRepos(entityManager).insert(rows)
        }
    },

    async getForLocale({ pieceIds, locale }: GetForLocaleParams): Promise<Map<string, Record<string, string>>> {
        if (pieceIds.length === 0) {
            return new Map()
        }
        const rows = await pieceTranslationRepos().manager
            .createQueryBuilder(PieceMetadataEntity, 'pm')
            .leftJoin(PieceTranslationEntity.options.name, 'pt', 'pt."pieceMetadataId" = pm."id" AND pt."locale" = :locale')
            .select('pm."id"', 'id')
            .addSelect(`COALESCE(pt."translations", CASE WHEN NOT EXISTS (${PIECE_HAS_TRANSLATION_ROWS}) THEN (pm."i18n" -> :locale)::jsonb END)`, 'translations')
            .where('pm."id" IN (:...pieceIds)', { pieceIds })
            .setParameter('locale', locale)
            .getRawMany<{ id: string, translations: Record<string, string> | null }>()
        return new Map(rows.flatMap((row) => isNil(row.translations) ? [] : [[row.id, row.translations]]))
    },
}

function toRows({ pieceMetadataId, i18n }: ToRowsParams): PieceTranslationSchema[] {
    return Object.entries(i18n ?? {}).flatMap(([locale, translations]) =>
        isNil(translations) ? [] : [{ pieceMetadataId, locale, translations: Object.fromEntries(sanitizeObjectForPostgresql(Object.entries(translations))) }],
    )
}

const PIECE_HAS_TRANSLATION_ROWS = `SELECT 1 FROM "${PieceTranslationEntity.options.name}" stored WHERE stored."pieceMetadataId" = pm."id"`

type SaveParams = {
    pieceMetadataId: string
    i18n: I18nForPiece
    entityManager: EntityManager
}

type GetForLocaleParams = {
    pieceIds: string[]
    locale: LocalesEnum
}

type ToRowsParams = {
    pieceMetadataId: string
    i18n: I18nForPiece
}
