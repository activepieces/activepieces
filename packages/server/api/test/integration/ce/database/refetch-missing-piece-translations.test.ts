import { apId, LocalesEnum } from '@activepieces/core-utils'
import { ApEdition, PackageType, PieceSyncMode, PieceType } from '@activepieces/shared'
import { AxiosError } from 'axios'
import { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { backgroundMigrationRunner } from '../../../../src/app/database/background-migration-runner'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { RefetchMissingPieceTranslations1879000000000 } from '../../../../src/app/database/migration/postgres/background/1879000000000-RefetchMissingPieceTranslations'
import { pieceMetadataService } from '../../../../src/app/pieces/metadata/piece-metadata-service'
import { createMockPieceMetadata } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }))

vi.mock('@activepieces/server-utils', async (importOriginal) => {
    const original = await importOriginal<typeof import('@activepieces/server-utils')>()
    return {
        ...original,
        safeHttp: { ...original.safeHttp, axios: { get: getMock } },
    }
})

const REGISTRY_I18N = {
    [LocalesEnum.GERMAN]: { 'Send a message': 'Eine Nachricht senden' },
    [LocalesEnum.JAPANESE]: { 'Send a message': 'メッセージを送信' },
}

const lastGoodSync = officialPiece({ name: '@activepieces/piece-refetch-slack', version: '0.23.0', i18n: REGISTRY_I18N })
const brokenAfterLastGoodSync = officialPiece({ name: '@activepieces/piece-refetch-slack', version: '0.23.1', created: '2023-06-05T00:00:00.000Z' })
const untranslatedBeforeLastGoodSync = officialPiece({ name: '@activepieces/piece-refetch-slack', version: '0.1.0' })
const brokenGoneFromCloud = officialPiece({ name: '@activepieces/piece-refetch-gone', version: '0.1.0' })
const brokenMismatched = officialPiece({ name: '@activepieces/piece-refetch-mismatched', version: '5.0.0' })
const brokenFetchFails = officialPiece({ name: '@activepieces/piece-refetch-unreachable', version: '1.0.0' })
const untranslatedUpstream = officialPiece({ name: '@activepieces/piece-refetch-untranslated', version: '2.0.0' })
const canary = officialPiece({ name: '@activepieces/piece-refetch-canary', version: '9.0.0', i18n: REGISTRY_I18N })
const customPiece = createMockPieceMetadata({ name: '@activepieces/piece-refetch-custom', version: '4.0.0', pieceType: PieceType.CUSTOM, packageType: PackageType.REGISTRY, platformId: apId(), i18n: undefined })
const seeded = [lastGoodSync, brokenAfterLastGoodSync, untranslatedBeforeLastGoodSync, brokenGoneFromCloud, brokenMismatched, brokenFetchFails, untranslatedUpstream, canary, customPiece]

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
    await backgroundMigrationRunner.ensureTable()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    process.env.AP_PIECES_SYNC_MODE = PieceSyncMode.OFFICIAL_AUTO
    await databaseConnection().getRepository('piece_metadata').createQueryBuilder().delete().execute()
    await databaseConnection().query('DELETE FROM "background_migrations" WHERE "name" = $1', [new RefetchMissingPieceTranslations1879000000000().name])
    await seed({ pieces: seeded })
    getMock.mockImplementation(async (url: string) => stubRegistry({ url }))
})

afterEach(() => {
    process.env.AP_PIECES_SYNC_MODE = PieceSyncMode.NONE
    getMock.mockReset()
})

describe('RefetchMissingPieceTranslations', () => {
    it('restores every locale for a version newer than the last good sync, whatever its registry created date', async () => {
        await runThroughRunner()

        expect(await translationsOf(brokenAfterLastGoodSync.id)).toEqual(REGISTRY_I18N)
        expect(getMock.mock.calls.every(([, config]) => typeof config?.timeout === 'number' && config.timeout > 0)).toBe(true)
    })

    it('fetches every untranslated version, including ones older than a translated version of the same piece', async () => {
        await runThroughRunner()

        expect(fetchedVersions()).toContain(key(untranslatedBeforeLastGoodSync))
        expect(await translationsOf(untranslatedBeforeLastGoodSync.id)).toEqual(REGISTRY_I18N)
    })

    it('does not fetch versions that are already translated, except as a canary', async () => {
        const translatedOlder = officialPiece({ name: '@activepieces/piece-refetch-slack', version: '0.20.0', i18n: REGISTRY_I18N })
        await seed({ pieces: [translatedOlder] })

        await runThroughRunner()

        expect(fetchedVersions()).not.toContain(key(translatedOlder))
        expect(fetchedVersions().filter((fetched) => fetched === key(lastGoodSync)).length).toBeLessThanOrEqual(1)
    })

    it('repairs a broken version even after sync installed a newer translated version once the cloud fix was live', async () => {
        const syncedAfterFix = officialPiece({ name: '@activepieces/piece-refetch-slack', version: '0.24.0', i18n: REGISTRY_I18N })
        await seed({ pieces: [syncedAfterFix] })

        await runThroughRunner()

        expect(await translationsOf(brokenAfterLastGoodSync.id)).toEqual(REGISTRY_I18N)
    })

    it('repairs on the retry a broken version that failed while a newer one was restored', async () => {
        const firstGood = officialPiece({ name: '@activepieces/piece-refetch-retry', version: '1.0.0', i18n: REGISTRY_I18N })
        const brokenFailsFirst = officialPiece({ name: '@activepieces/piece-refetch-retry', version: '1.0.1' })
        const brokenRestoredFirst = officialPiece({ name: '@activepieces/piece-refetch-retry', version: '1.0.2' })
        const outage = Array.from({ length: 6 }, (_, index) => officialPiece({ name: `@activepieces/piece-refetch-retry-outage-${index}`, version: '1.0.0' }))
        await seed({ pieces: [firstGood, brokenFailsFirst, brokenRestoredFirst, ...outage] })
        const serve = ({ url }: { url: string }): { data: unknown } => {
            const version = new URL(url).searchParams.get('version')
            const piece = [brokenFailsFirst, brokenRestoredFirst, ...outage].find((candidate) => url.includes(`${candidate.name}?`) && candidate.version === version)
            return piece ? { data: { name: piece.name, version, i18n: REGISTRY_I18N } } : stubRegistry({ url })
        }
        getMock.mockImplementation(async (url: string) => {
            const failing = outage.some((piece) => url.includes(`${piece.name}?`)) || (url.includes(`${brokenFailsFirst.name}?`) && url.includes(`version=${brokenFailsFirst.version}`))
            if (failing) {
                throw httpError({ status: 503 })
            }
            return serve({ url })
        })

        await expect(runThroughRunner()).rejects.toThrow(/failed transiently/)
        expect(await translationsOf(brokenRestoredFirst.id)).toEqual(REGISTRY_I18N)
        expect(await translationsOf(brokenFailsFirst.id)).toEqual({})

        getMock.mockImplementation(async (url: string) => serve({ url }))
        await runThroughRunner()

        expect(await translationsOf(brokenFailsFirst.id)).toEqual(REGISTRY_I18N)
        expect(await markedComplete()).toBe(true)
    })

    it('fetches versions directly, without the instance\'s registry list', async () => {
        await runThroughRunner()

        expect(getMock.mock.calls.some(([url]) => String(url).includes('/registry'))).toBe(false)
        expect(fetchedVersions()).toEqual(expect.arrayContaining([key(brokenAfterLastGoodSync), key(brokenGoneFromCloud)]))
    })

    it('leaves a version cloud no longer serves (404) installed and untranslated, and completes', async () => {
        await runThroughRunner()

        expect(await rowExists(brokenGoneFromCloud.id)).toBe(true)
        expect(await translationsOf(brokenGoneFromCloud.id)).toEqual({})
        expect(await markedComplete()).toBe(true)
    })

    it('does not attach translations when the registry answers with a different version', async () => {
        await runThroughRunner()

        expect(await translationsOf(brokenMismatched.id)).toEqual({})
    })

    it('skips a few transient failures and still completes', async () => {
        await runThroughRunner()

        expect(await translationsOf(brokenFetchFails.id)).toEqual({})
        expect(await translationsOf(brokenAfterLastGoodSync.id)).toEqual(REGISTRY_I18N)
        expect(await markedComplete()).toBe(true)
    })

    it('fails the run when many requests fail transiently, and restores them on the retry', async () => {
        const outage = Array.from({ length: 6 }, (_, index) => officialPiece({ name: `@activepieces/piece-refetch-outage-${index}`, version: '1.0.0' }))
        await seed({ pieces: outage })
        getMock.mockImplementation(async (url: string) => {
            if (outage.some((piece) => url.includes(piece.name))) {
                throw httpError({ status: 503 })
            }
            return stubRegistry({ url })
        })

        await expect(runThroughRunner()).rejects.toThrow(/failed transiently/)
        expect(await markedComplete()).toBe(false)
        expect(await translationsOf(brokenAfterLastGoodSync.id)).toEqual(REGISTRY_I18N)

        getMock.mockImplementation(async (url: string) => {
            const piece = outage.find((candidate) => url.includes(candidate.name))
            return piece ? { data: { name: piece.name, version: piece.version, i18n: REGISTRY_I18N } } : stubRegistry({ url })
        })
        await runThroughRunner()

        expect(await translationsOf(outage[0].id)).toEqual(REGISTRY_I18N)
        expect(await markedComplete()).toBe(true)
    })

    it('completes when many versions are gone from cloud, since a 404 is not worth retrying', async () => {
        const removed = Array.from({ length: 6 }, (_, index) => officialPiece({ name: `@activepieces/piece-refetch-removed-${index}`, version: '1.0.0' }))
        await seed({ pieces: removed })
        getMock.mockImplementation(async (url: string) => removed.some((piece) => url.includes(piece.name))
            ? Promise.reject(httpError({ status: 404 }))
            : stubRegistry({ url }))

        await runThroughRunner()

        expect(await markedComplete()).toBe(true)
        expect(await rowExists(removed[0].id)).toBe(true)
    })

    it('completes when cloud rejects many versions with a 4xx, since its validation will not change on retry', async () => {
        const invalid = Array.from({ length: 6 }, (_, index) => officialPiece({ name: `@activepieces/piece-refetch-invalid-${index}`, version: '1.0.0-beta.1' }))
        await seed({ pieces: invalid })
        getMock.mockImplementation(async (url: string) => invalid.some((piece) => url.includes(piece.name))
            ? Promise.reject(httpError({ status: 400 }))
            : stubRegistry({ url }))

        await runThroughRunner()

        expect(await markedComplete()).toBe(true)
        expect(await rowExists(invalid[0].id)).toBe(true)
    })

    it('treats rate limiting and timeouts as transient, so the run retries', async () => {
        const throttled = Array.from({ length: 3 }, (_, index) => officialPiece({ name: `@activepieces/piece-refetch-throttled-${index}`, version: '1.0.0' }))
        const timedOut = Array.from({ length: 3 }, (_, index) => officialPiece({ name: `@activepieces/piece-refetch-timedout-${index}`, version: '1.0.0' }))
        await seed({ pieces: [...throttled, ...timedOut] })
        getMock.mockImplementation(async (url: string) => {
            if (throttled.some((piece) => url.includes(piece.name))) {
                throw httpError({ status: 429 })
            }
            if (timedOut.some((piece) => url.includes(piece.name))) {
                throw new AxiosError('timeout of 30000ms exceeded', 'ECONNABORTED')
            }
            return stubRegistry({ url })
        })

        await expect(runThroughRunner()).rejects.toThrow(/failed transiently/)
        expect(await markedComplete()).toBe(false)
    })

    it('fails the run without restoring anything when the registry serves a translated version without translations', async () => {
        getMock.mockImplementation(async (url: string) => url.includes(canary.name)
            ? { data: { name: canary.name, version: canary.version } }
            : stubRegistry({ url }))

        await expect(runThroughRunner()).rejects.toThrow(/without translations/)
        expect(await translationsOf(brokenAfterLastGoodSync.id)).toEqual({})
        expect(await markedComplete()).toBe(false)
    })

    it('fails the run without restoring anything when the canary request itself fails', async () => {
        getMock.mockImplementation(async (url: string) => url.includes(canary.name)
            ? Promise.reject(httpError({ status: 503 }))
            : stubRegistry({ url }))

        await expect(runThroughRunner()).rejects.toThrow(/canary/)
        expect(await translationsOf(brokenAfterLastGoodSync.id)).toEqual({})
        expect(await markedComplete()).toBe(false)
    })

    it('tries the next translated version when cloud no longer serves the first canary', async () => {
        getMock.mockImplementation(async (url: string) => url.includes(canary.name)
            ? Promise.reject(httpError({ status: 404 }))
            : stubRegistry({ url }))

        await runThroughRunner()

        expect(fetchedVersions()).toEqual(expect.arrayContaining([key(canary), key(lastGoodSync)]))
        expect(await translationsOf(brokenAfterLastGoodSync.id)).toEqual(REGISTRY_I18N)
        expect(await markedComplete()).toBe(true)
    })

    it('still fails the run when a later canary is served without translations', async () => {
        getMock.mockImplementation(async (url: string) => {
            if (url.includes(canary.name)) {
                throw httpError({ status: 404 })
            }
            if (url.includes(lastGoodSync.name) && url.includes(`version=${lastGoodSync.version}`)) {
                return { data: { name: lastGoodSync.name, version: lastGoodSync.version } }
            }
            return stubRegistry({ url })
        })

        await expect(runThroughRunner()).rejects.toThrow(/without translations/)
        expect(await markedComplete()).toBe(false)
    })

    it('skips the canary check and still repairs when cloud serves none of the translated versions', async () => {
        getMock.mockImplementation(async (url: string) => {
            if (url.includes(canary.name) || (url.includes(lastGoodSync.name) && url.includes(`version=${lastGoodSync.version}`))) {
                throw httpError({ status: 400 })
            }
            return stubRegistry({ url })
        })

        await runThroughRunner()

        expect(await translationsOf(brokenAfterLastGoodSync.id)).toEqual(REGISTRY_I18N)
        expect(await markedComplete()).toBe(true)
    })

    it('skips the canary check when no translated version is installed', async () => {
        await databaseConnection().query('DELETE FROM "piece_metadata" WHERE "id" = ANY($1)', [[lastGoodSync.id, canary.id]])

        await runThroughRunner()

        expect(await translationsOf(brokenAfterLastGoodSync.id)).toEqual(REGISTRY_I18N)
        expect(await translationsOf(untranslatedBeforeLastGoodSync.id)).toEqual(REGISTRY_I18N)
        expect(await markedComplete()).toBe(true)
    })

    it('fetches untranslated versions that are not valid semver but never translated ones', async () => {
        const translatedSemver = officialPiece({ name: '@activepieces/piece-refetch-nonsemver', version: '1.0.0', i18n: REGISTRY_I18N })
        const translatedNonSemver = officialPiece({ name: '@activepieces/piece-refetch-nonsemver', version: 'nightly', i18n: REGISTRY_I18N })
        const untranslatedNonSemver = officialPiece({ name: '@activepieces/piece-refetch-nonsemver', version: 'nightly-2' })
        await seed({ pieces: [translatedSemver, translatedNonSemver, untranslatedNonSemver] })
        getMock.mockImplementation(async (url: string) => {
            const version = new URL(url).searchParams.get('version')
            return url.includes('piece-refetch-nonsemver')
                ? { data: { name: '@activepieces/piece-refetch-nonsemver', version, i18n: REGISTRY_I18N } }
                : stubRegistry({ url })
        })

        await runThroughRunner()

        expect(fetchedVersions()).toContain(key(untranslatedNonSemver))
        expect(fetchedVersions()).not.toContain(key(translatedNonSemver))
        expect(await translationsOf(untranslatedNonSemver.id)).toEqual(REGISTRY_I18N)
    })

    it('does not fetch custom pieces', async () => {
        await runThroughRunner()

        expect(fetchedVersions()).not.toContain(key(customPiece))
        expect(await translationsOf(untranslatedUpstream.id)).toEqual({})
    })

    it('does nothing on cloud, which is the registry itself', async () => {
        const edition = process.env.AP_EDITION
        process.env.AP_EDITION = ApEdition.CLOUD
        try {
            await runThroughRunner()
        }
        finally {
            process.env.AP_EDITION = edition
        }

        expect(getMock).not.toHaveBeenCalled()
        expect(await translationsOf(brokenAfterLastGoodSync.id)).toEqual({})
    })

    it('does nothing when piece sync is off', async () => {
        process.env.AP_PIECES_SYNC_MODE = PieceSyncMode.NONE

        await runThroughRunner()

        expect(getMock).not.toHaveBeenCalled()
        expect(await translationsOf(brokenAfterLastGoodSync.id)).toEqual({})
        expect(await markedComplete()).toBe(true)
    })
})

function officialPiece({ name, version, created, i18n }: { name: string, version: string, created?: string, i18n?: typeof REGISTRY_I18N }): ReturnType<typeof createMockPieceMetadata> {
    return createMockPieceMetadata({ name, version, created, i18n, pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY, platformId: undefined })
}

async function seed({ pieces }: { pieces: ReturnType<typeof createMockPieceMetadata>[] }): Promise<void> {
    for (const piece of pieces) {
        await pieceMetadataService(app!.log).create({ pieceMetadata: piece, packageType: PackageType.REGISTRY, pieceType: piece.pieceType, publishCacheRefresh: false })
    }
}

function stubRegistry({ url }: { url: string }): { data: unknown } {
    const version = new URL(url).searchParams.get('version')
    if (url.includes(brokenFetchFails.name)) {
        throw new Error('connect ETIMEDOUT')
    }
    if (url.includes(brokenGoneFromCloud.name)) {
        throw httpError({ status: 404 })
    }
    if (url.includes(brokenMismatched.name)) {
        return { data: { name: brokenMismatched.name, version: '5.0.1', i18n: REGISTRY_I18N } }
    }
    if (url.includes(untranslatedUpstream.name)) {
        return { data: { name: untranslatedUpstream.name, version: untranslatedUpstream.version } }
    }
    const piece = seeded.find((candidate) => url.includes(candidate.name) && candidate.version === version)
    return { data: { name: piece?.name, version, i18n: REGISTRY_I18N } }
}

function httpError({ status }: { status: number }): AxiosError {
    return Object.assign(new AxiosError(`Request failed with status code ${status}`), { response: { status } })
}

function key({ name, version }: { name: string, version: string }): string {
    return `${name}@${version}`
}

function fetchedVersions(): string[] {
    return getMock.mock.calls
        .map(([url]) => new URL(String(url)))
        .filter((url) => !url.pathname.endsWith('/registry'))
        .map((url) => `${decodeURIComponent(url.pathname.replace('/api/v1/pieces/', ''))}@${url.searchParams.get('version')}`)
}

async function runThroughRunner(): Promise<void> {
    await backgroundMigrationRunner.run({ log: app!.log, migrations: [RefetchMissingPieceTranslations1879000000000] })
}

async function translationsOf(pieceMetadataId: string): Promise<Record<string, unknown>> {
    const rows: { locale: string, translations: unknown }[] = await databaseConnection().query(
        'SELECT "locale", "translations" FROM "piece_translation" WHERE "pieceMetadataId" = $1',
        [pieceMetadataId],
    )
    return Object.fromEntries(rows.map((row) => [row.locale, row.translations]))
}

async function rowExists(id: string): Promise<boolean> {
    const rows = await databaseConnection().query('SELECT 1 FROM "piece_metadata" WHERE "id" = $1', [id])
    return rows.length > 0
}

async function markedComplete(): Promise<boolean> {
    const rows = await databaseConnection().query(
        'SELECT 1 FROM "background_migrations" WHERE "name" = $1 AND "executed_at" IS NOT NULL',
        [new RefetchMissingPieceTranslations1879000000000().name],
    )
    return rows.length > 0
}
