import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, Changelog } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { getRedisConnection } from '../database/redis-connection'
import { system } from '../helper/system/system'
import { systemJobsSchedule } from '../helper/system-jobs'
import { SystemJobName } from '../helper/system-jobs/common'
import { systemJobHandlers } from '../helper/system-jobs/job-handlers'
import { changelogController } from './changelog.controller'

export const changelogModule: FastifyPluginAsyncTypebox = async (fastify) => {
    systemJobHandlers.registerJobHandler(SystemJobName.CHANGELOG, async () => {
        const log = fastify.log
        const redis = getRedisConnection()
        log.info('Running changelog retrieval')
        const changelogs = await getChangelog()
        log.info({ changelogs }, 'Changelogs fetched')
        await redis.set(SystemJobName.CHANGELOG, JSON.stringify(changelogs))
        log.info('Changelog retrieval completed')
    })

    await systemJobsSchedule(fastify.log).upsertJob({
        job: {
            name: SystemJobName.CHANGELOG,
            data: {},
        },
        schedule: {
            type: 'repeated',
            cron: '0 0 * * *',
        },
    })
    
    await fastify.register(changelogController, { prefix: '/v1/changelogs' })
}

async function getChangelog(): Promise<Changelog> {
    const isCloudEdition = system.getOrThrow(AppSystemProp.EDITION) === ApEdition.CLOUD
    try {
        if (isCloudEdition) {
            return getChangelogFeaturebaseRequest()
        }
        else {
            return getChangelogActivepiecesRequest()
        }
    } catch (error) {
        console.error('Error fetching changelog', error)
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
    const data = await response.text()
    const parsedData = JSON.parse(data)
    
    return parsedData
}