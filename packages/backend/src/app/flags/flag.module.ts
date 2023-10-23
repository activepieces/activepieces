import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { flagService } from './flag.service'
import { getEdition } from '../helper/secret-helper'
import { ApEdition, ApFlagId } from '@activepieces/shared'
import { themeHelper } from '../ee/helper/theme-helper'
import { FastifyRequest } from 'fastify'

export const flagModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(flagController, { prefix: '/v1/flags' })
}

export const flagController: FastifyPluginAsyncTypebox = async (app) => {
    app.get(
        '/',
        {
            logLevel: 'silent',
        },
        async (request: FastifyRequest) => {
            const flags = await flagService.getAll()
            const edition = getEdition()
            const flagsMap: Record<string, unknown> = flags.reduce((map, flag) => ({ ...map, [flag.id as string]: flag.value }), {})
            if (edition !== ApEdition.COMMUNITY) {
                flagsMap[ApFlagId.THEME] = await themeHelper.getTheme({ projectId: request.principal.projectId, hostname: request.hostname })
            }
            return flagsMap
        },
    )
}
