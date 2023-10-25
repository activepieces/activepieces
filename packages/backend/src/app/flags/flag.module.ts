import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { flagService } from './flag.service'
import { getEdition } from '../helper/secret-helper'
import { ApEdition, ApFlagId } from '@activepieces/shared'
import { apperanceHelper } from '../ee/helper/apperance-helper'
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
                // TODO MOVE totally inside ee
                const whitelabeled = await apperanceHelper.isWhiteLabeled({ projectId: request.principal.projectId, hostname: request.hostname })
                if (whitelabeled) {
                    flagsMap[ApFlagId.THEME] = await apperanceHelper.getTheme({ projectId: request.principal.projectId, hostname: request.hostname })
                    flagsMap[ApFlagId.SHOW_COMMUNITY] = false
                    flagsMap[ApFlagId.SHOW_DOCS] = false
                    flagsMap[ApFlagId.SHOW_BILLING] = false
                    flagsMap[ApFlagId.SHOW_AUTH_PROVIDERS] = false
                    flagsMap[ApFlagId.SHOW_BLOG_GUIDE] = false
                }
            }
            return flagsMap
        },
    )
}
