import { AppSystemProp } from '@activepieces/server-shared'
import { ActivepiecesError, ErrorCode, isNil, SetStatusTemplateRequestBody } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../helper/system/system'


const TEMPLATE_MANAGER_URL = 'https://template-manager.activepieces.com/api/public/analytics'
const TEMPLATE_MANAGER_API_KEY = system.get(AppSystemProp.TEMPLATE_MANAGER_API_KEY)
const TEMPLATE_MANAGER_API_KEY_HEADER = 'X-API-Key'

export const templateManagerService = (log: FastifyBaseLogger) => ({
    async view(id: string): Promise<void> {
        if (isNil(TEMPLATE_MANAGER_API_KEY)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Template manager API key is not set',
                },
            })
        }
        const url = `${TEMPLATE_MANAGER_URL}/templates/${id}/view`
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                [TEMPLATE_MANAGER_API_KEY_HEADER]: TEMPLATE_MANAGER_API_KEY,
            },
        })
        log.info({ response }, 'Template view manager response')
    },
    async install(id: string, body: InstallTemplateRequestBody): Promise<void> {
        if (isNil(TEMPLATE_MANAGER_API_KEY)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Template manager API key is not set',
                },
            })
        }
        const url = `${TEMPLATE_MANAGER_URL}/templates/${id}/install`
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                [TEMPLATE_MANAGER_API_KEY_HEADER]: TEMPLATE_MANAGER_API_KEY,
            },
            body: JSON.stringify(body),
        })
        log.info({ response }, 'Template install manager response')
    },
    async setStatus(id: string, body: SetStatusTemplateRequestBody): Promise<void> {
        if (isNil(TEMPLATE_MANAGER_API_KEY)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Template manager API key is not set',
                },
            })
        }
        const activeOrDeactive = body.status ? 'activate' : 'deactivate'
        const url = `${TEMPLATE_MANAGER_URL}/templates/${id}/${activeOrDeactive}`
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                [TEMPLATE_MANAGER_API_KEY_HEADER]: TEMPLATE_MANAGER_API_KEY,
            },
            body: JSON.stringify({
                flowId: body.flowId,
            }),
        })
        log.info({ response }, `Template set status ${activeOrDeactive} manager response`)
    },
    async clickExploreButton(): Promise<void> {
        if (isNil(TEMPLATE_MANAGER_API_KEY)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Template manager API key is not set',
                },
            })
        }
        const url = `${TEMPLATE_MANAGER_URL}/explore/view`
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                [TEMPLATE_MANAGER_API_KEY_HEADER]: TEMPLATE_MANAGER_API_KEY,
            },
        })
        log.info({ response }, 'Template click explore button manager response')
    },
})


type InstallTemplateRequestBody = {
    userId: string
}