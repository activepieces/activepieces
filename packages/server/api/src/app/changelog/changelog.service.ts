import { AppSystemProp } from '@activepieces/server-shared'
import { ActivepiecesError, ApEdition, Changelog, ErrorCode } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { distributedStore } from '../helper/keyvalue'
import { system } from '../helper/system/system'

const CHANGELOG_KEY = 'changelogs'

type ChangelogStore = {
    lastFetched: string
    data: Changelog
}

const emptyChangelog: Changelog = {
    results: [],
    page: 1,
    limit: 100,
    totalPages: 1,
    totalResults: 0,
}

export const changelogService = (logger: FastifyBaseLogger) => ({
    async list(): Promise<Changelog> {
        const changelogs: ChangelogStore = await distributedStore().get(CHANGELOG_KEY) ?? {
            lastFetched: dayjs().subtract(1, 'day').toISOString(),
            data: emptyChangelog,
        }
        if (dayjs(changelogs.lastFetched).isBefore(dayjs().subtract(1, 'day'))) {
            const newChangelogs = await getChangelog(logger)
            const changelogStore: ChangelogStore = {
                lastFetched: dayjs().toISOString(),
                data: newChangelogs,
            }
            await distributedStore().put(CHANGELOG_KEY, changelogStore)
            return newChangelogs
        }
        return changelogs.data
    },
})
async function getChangelog(logger: FastifyBaseLogger): Promise<Changelog> {
    const isCloudEdition = system.getOrThrow(AppSystemProp.EDITION) === ApEdition.CLOUD
    try {
        if (isCloudEdition) {
            return await getChangelogFeaturebaseRequest()
        }
        else {
            return await getChangelogActivepiecesRequest()
        }
    }
    catch (error) {
        logger.error('Error fetching changelog', error)
        return {
            results: [],
            page: 1,
            limit: 100,
            totalPages: 1,
            totalResults: 0,
        }
    }
}

async function getChangelogFeaturebaseRequest(): Promise<Changelog> {
    const featurebaseApiKey = system.getOrThrow(AppSystemProp.FEATUREBASE_API_KEY)
    const results: unknown[] = []
    let page = 1
    const limit = 100
    let totalPages = 1
    let totalResults = 0
    
    do {
        const queryparams = new URLSearchParams()
        queryparams.append('state', 'live')
        queryparams.append('limit', limit.toString())
        queryparams.append('page', page.toString())
        
        const url = new URL(`https://do.featurebase.app/v2/changelog?${queryparams.toString()}`)
        const headers = new Headers()
        headers.append('X-API-Key', featurebaseApiKey)

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers,
        })
        if (!response.ok) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Could not fetch changelog',
                },
            })
        }
        const data = await response.text()
        const parsedData = JSON.parse(data)
        if (parsedData.totalPages) {
            totalPages = parsedData.totalPages
        }
        if (parsedData.totalResults) {
            totalResults = parsedData.totalResults
        }
        
        results.push(...parsedData.results)
        page++
    } while (page <= totalPages)

    return {
        results,
        page: 1,
        limit,
        totalPages,
        totalResults,
    }
}

async function getChangelogActivepiecesRequest(): Promise<Changelog> {
    const url = new URL('http://cloud.activepieces.com/api/v1/changelogs')

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    if (!response.ok) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'Could not fetch changelog',
            },
        })
    }
    const data = await response.text()
    const parsedData = JSON.parse(data)
    
    return parsedData
}