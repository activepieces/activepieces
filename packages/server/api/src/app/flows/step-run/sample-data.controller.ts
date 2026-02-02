import { ProjectResourceType, securityAccess } from '@activepieces/server-shared'
import { CreateStepRunRequestBody, GetSampleDataRequest, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { flowService } from '../flow/flow.service'
import { flowRunService } from '../flow-run/flow-run-service'
import { sampleDataService } from './sample-data.service'

export const sampleDataController: FastifyPluginAsyncTypebox = async (fastify) => {

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
            [PrincipalType.USER, PrincipalType.SERVICE], 
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