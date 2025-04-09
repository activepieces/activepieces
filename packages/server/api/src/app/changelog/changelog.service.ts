import { AppSystemProp } from '@activepieces/server-shared'
import { Changelog } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../helper/system/system'

export const changelogService = (logger: FastifyBaseLogger) => ({
    async list(): Promise<Changelog> {
        try {
            const changelogs =  await getChangelogRequest()
            return changelogs
        }
        catch (error) {
            logger.error('Error fetching changelogs:', error)
            return {
                results: [],
                page: 1,
                limit: 100,
                totalPages: 1,
                totalResults: 0,
            }
        }
    },
})
async function getChangelogRequest(): Promise<Changelog> {
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