import { chunk, isNil, isObject, sanitizeObjectForPostgresql, tryCatch } from '@activepieces/core-utils'
import { safeHttp } from '@activepieces/server-utils'
import { ApEdition, PieceAudienceFilter, PieceSyncMode } from '@activepieces/shared'
import { isAxiosError } from 'axios'
import semver from 'semver'
import { QueryRunner } from 'typeorm'
import { system } from '../../../../helper/system/system'
import { AppSystemProp } from '../../../../helper/system/system-props'
import { BackgroundMigration } from '../../../background-migration'

export class RefetchMissingPieceTranslations1879000000000 implements BackgroundMigration {
    name = 'RefetchMissingPieceTranslations1879000000000'
    release = '0.93.0'
    transaction = false as const

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (system.getEdition() === ApEdition.CLOUD || system.get(AppSystemProp.PIECES_SYNC_MODE) !== PieceSyncMode.OFFICIAL_AUTO) {
            return
        }
        const versions = await listOfficialVersions({ queryRunner })
        const candidates = versions.filter((version) => !version.translated)
        if (candidates.length === 0) {
            return
        }
        await assertRegistryServesTranslations({ versions })
        const outcomes = await chunk(candidates, BATCH_SIZE).reduce<Promise<RestoreOutcome[]>>(
            async (previous, batch) => [
                ...await previous,
                ...await Promise.all(batch.map((piece) => restoreTranslations({ queryRunner, piece }))),
            ],
            Promise.resolve([]),
        )
        const counts = countOutcomes({ outcomes })
        system.globalLogger().info({
            migration: { name: this.name, candidates: candidates.length, ...counts },
        }, '[RefetchMissingPieceTranslations] Restored translations for piece versions synced without them')
        if (counts.transient > Math.max(MAX_SKIPPED_TRANSIENT_FAILURES, candidates.length * MAX_SKIPPED_TRANSIENT_RATIO)) {
            throw new Error(`Registry failed transiently for ${counts.transient} of ${candidates.length} piece versions; retrying the remaining ones later`)
        }
    }

    public async down(): Promise<void> {
        return
    }
}

async function listOfficialVersions({ queryRunner }: { queryRunner: QueryRunner }): Promise<OfficialVersion[]> {
    const rows: unknown = await queryRunner.query(`
        SELECT pm."id", pm."name", pm."version",
               (pm."i18n" IS NOT NULL OR EXISTS (SELECT 1 FROM "piece_translation" t WHERE t."pieceMetadataId" = pm."id")) AS "translated"
          FROM "piece_metadata" pm
         WHERE pm."pieceType" = 'OFFICIAL'
    `)
    return Array.isArray(rows) ? rows.filter(isOfficialVersion) : []
}

async function assertRegistryServesTranslations({ versions }: { versions: OfficialVersion[] }): Promise<void> {
    const canaries = sortBySemver({ versions: versions.filter((version) => version.translated) }).reverse().slice(0, MAX_CANARIES)
    for (const canary of canaries) {
        const { data: body, error } = await tryCatch(async () => fetchPieceVersion({ piece: canary }))
        if (error && classifyFailure({ error }) === 'transient') {
            throw new Error(`Registry canary ${versionKey(canary)} failed (${error.message}); retrying later`)
        }
        if (error || !isVersionRef(body) || versionKey(body) !== versionKey(canary)) {
            continue
        }
        if (toTranslationRows({ pieceMetadataId: canary.id, body }).length === 0) {
            throw new Error(`Registry returned ${versionKey(canary)} without translations although it is translated here; the registry may be serving a build without them, retrying later`)
        }
        return
    }
    system.globalLogger().warn({ triedCanaries: canaries.map(versionKey) }, '[RefetchMissingPieceTranslations] No translated piece version installed that the registry still serves, skipping the registry canary check')
}

async function restoreTranslations({ queryRunner, piece }: RestoreTranslationsParams): Promise<RestoreOutcome> {
    const { data: body, error } = await tryCatch(async () => fetchPieceVersion({ piece }))
    if (error) {
        const outcome = classifyFailure({ error })
        system.globalLogger().warn({ piece: { name: piece.name, version: piece.version }, outcome, error: error.message }, outcome === 'transient'
            ? '[RefetchMissingPieceTranslations] Registry request failed, the run retries if too many fail'
            : '[RefetchMissingPieceTranslations] Registry will not serve this version, leaving it untranslated')
        return outcome
    }
    if (!isVersionRef(body) || versionKey(body) !== versionKey(piece)) {
        system.globalLogger().warn({ piece: { name: piece.name, version: piece.version } }, '[RefetchMissingPieceTranslations] Registry returned a different piece version, leaving it untranslated')
        return 'mismatched'
    }
    const rows = toTranslationRows({ pieceMetadataId: piece.id, body })
    if (rows.length === 0) {
        return 'untranslated'
    }
    await queryRunner.query(`
        INSERT INTO "piece_translation" ("pieceMetadataId", "locale", "translations")
        SELECT row."pieceMetadataId", row."locale", row."translations"
          FROM jsonb_to_recordset($1::jsonb) AS row("pieceMetadataId" varchar, "locale" varchar, "translations" jsonb)
        ON CONFLICT DO NOTHING
    `, [JSON.stringify(rows)])
    return 'restored'
}

async function fetchPieceVersion({ piece }: { piece: OfficialVersion }): Promise<unknown> {
    const params = new URLSearchParams({ audience: PieceAudienceFilter.ALL, version: piece.version })
    const response = await safeHttp.axios.get<unknown>(`${CLOUD_PIECES_URL}/${piece.name}?${params.toString()}`, { timeout: REGISTRY_TIMEOUT_MS })
    return response.data
}

function classifyFailure({ error }: { error: Error }): 'notFound' | 'rejected' | 'transient' {
    const status = isAxiosError(error) ? error.response?.status : undefined
    if (isNil(status) || status === 408 || status === 429 || status >= 500) {
        return 'transient'
    }
    return status === 404 ? 'notFound' : 'rejected'
}

function toTranslationRows({ pieceMetadataId, body }: { pieceMetadataId: string, body: unknown }): TranslationRow[] {
    if (!isObject(body) || !('i18n' in body)) {
        return []
    }
    const sanitized = sanitizeObjectForPostgresql(body.i18n)
    if (!isObject(sanitized)) {
        return []
    }
    return Object.entries(sanitized).flatMap(([locale, translations]) =>
        isObject(translations) ? [{ pieceMetadataId, locale, translations }] : [],
    )
}

function sortBySemver({ versions }: { versions: OfficialVersion[] }): OfficialVersion[] {
    return versions
        .filter((version) => !isNil(semver.valid(version.version)))
        .sort((left, right) => semver.compare(left.version, right.version))
}

function countOutcomes({ outcomes }: { outcomes: RestoreOutcome[] }): Record<RestoreOutcome, number> {
    return {
        restored: outcomes.filter((outcome) => outcome === 'restored').length,
        untranslated: outcomes.filter((outcome) => outcome === 'untranslated').length,
        mismatched: outcomes.filter((outcome) => outcome === 'mismatched').length,
        notFound: outcomes.filter((outcome) => outcome === 'notFound').length,
        rejected: outcomes.filter((outcome) => outcome === 'rejected').length,
        transient: outcomes.filter((outcome) => outcome === 'transient').length,
    }
}

function versionKey({ name, version }: { name: string, version: string }): string {
    return `${name}@${version}`
}

function isVersionRef(value: unknown): value is { name: string, version: string } {
    return isObject(value) && 'name' in value && typeof value.name === 'string' && 'version' in value && typeof value.version === 'string'
}

function isOfficialVersion(value: unknown): value is OfficialVersion {
    return isVersionRef(value) && 'id' in value && typeof value.id === 'string' && 'translated' in value && typeof value.translated === 'boolean'
}

const CLOUD_PIECES_URL = 'https://cloud.activepieces.com/api/v1/pieces'
const BATCH_SIZE = 5
const MAX_CANARIES = 5
const REGISTRY_TIMEOUT_MS = 30_000
const MAX_SKIPPED_TRANSIENT_FAILURES = 5
const MAX_SKIPPED_TRANSIENT_RATIO = 0.05

type OfficialVersion = {
    id: string
    name: string
    version: string
    translated: boolean
}

type RestoreOutcome = 'restored' | 'untranslated' | 'mismatched' | 'notFound' | 'rejected' | 'transient'

type RestoreTranslationsParams = {
    queryRunner: QueryRunner
    piece: OfficialVersion
}

type TranslationRow = {
    pieceMetadataId: string
    locale: string
    translations: object
}
