import { CreateStepRunRequestBody, GetSampleDataRequest, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { ProjectResourceType } from '../../core/security/authorization/common'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { flowService } from '../flow/flow.service'
import { flowRunService } from '../flow-run/flow-run-service'
import { sampleDataService } from './sample-data.service'

export const sampleDataController: FastifyPluginAsyncZod = async (fastify) => {

    fastify.post('/test-step', TestSampleDataRequestBody, async (request) => {
        return flowRunService(request.log).test({
            projectId: request.projectId,
            flowVersionId: request.body.flowVersionId,
            stepNameToTest: request.body.stepName,
            triggeredBy: request.principal.id,
        })
    })

    fastify.get('/', GetSampleDataRequestParams, async (request) => {
        const flow = await flowService(request.log).getOnePopulatedOrThrow({
            id: request.query.flowId,
            projectId: request.projectId,
            versionId: request.query.flowVersionId,
        })
        const sampleData = await sampleDataService(request.log).getOrReturnEmpty({
            projectId: request.projectId,
            flowVersion: flow.version,
            stepName: request.query.stepName,
            type: request.query.type,
        })
        return sampleData
    })
}

const GetSampleDataRequestParams = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE, PrincipalType.ENGINE],
            undefined, {
                type: ProjectResourceType.QUERY,
            }),
    },
    schema: {
        tags: ['sample-data'],
        querystring: GetSampleDataRequest,
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
}

const TestSampleDataRequestBody = {
    config: {
        security: securityAccess.project(
            [PrincipalType.USER, PrincipalType.SERVICE], 
            undefined, {
                type: ProjectResourceType.BODY,
            }),
    },
    schema: {
        tags: ['sample-data'],
        body: CreateStepRunRequestBody,
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
}