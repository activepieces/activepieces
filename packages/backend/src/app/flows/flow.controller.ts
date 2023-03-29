import { FastifyInstance, FastifyRequest } from 'fastify';
import {
    CreateFlowRequest,
    FlowId,
    FlowOperationRequest,
    FlowVersionId,
    ListFlowsRequest,
} from '@activepieces/shared';
import { StatusCodes } from 'http-status-codes';
import { ActivepiecesError, ErrorCode } from '@activepieces/shared';
import { flowService } from './flow.service';
import { GuessFlowRequest } from '@activepieces/shared';
import { flowGuessService } from '@ee/magic-wand/openai';
import { flowVersionService } from './flow-version/flow-version.service';
import { logger } from '../helper/logger';

const DEFUALT_PAGE_SIZE = 10;

export const flowController = async (fastify: FastifyInstance) => {
    fastify.post(
        '/guess',
        {
            schema: {
                body: GuessFlowRequest,
            },
        },
        async (
            request: FastifyRequest<{
                Body: GuessFlowRequest;
            }>,
        ) => {
            const trigger = await flowGuessService.guessFlow(request.body.prompt);
            logger.info('Cleaned Actions ' + JSON.stringify(trigger));
            const flow = await flowService.create({
                projectId: request.principal.projectId, request: {
                    displayName: request.body.displayName,
                    collectionId: request.body.collectionId,
                },
            });
            const flowVersion = {
                ...flow.version,
                trigger: trigger,
            };
            await flowVersionService.overwriteVersion(flowVersion.id, flowVersion);
            return flowService.getOne({ id: flow.id, versionId: undefined, projectId: request.principal.projectId, includeArtifacts: false });
        },
    );

    fastify.post(
        '/',
        {
            schema: {
                body: CreateFlowRequest,
            },
        },
        async (
            request: FastifyRequest<{
                Body: CreateFlowRequest;
            }>,
        ) => {
            return await flowService.create({ projectId: request.principal.projectId, request: request.body });
        },
    );

    fastify.post(
        '/:flowId',
        {
            schema: {
                body: FlowOperationRequest,
            },
        },
        async (
            request: FastifyRequest<{
                Params: {
                    flowId: FlowId;
                };
                Body: FlowOperationRequest;
            }>,
        ) => {
            const flow = await flowService.getOne({ id: request.params.flowId, versionId: undefined, projectId: request.principal.projectId, includeArtifacts: false });
            if (flow === null) {
                throw new ActivepiecesError({ code: ErrorCode.FLOW_NOT_FOUND, params: { id: request.params.flowId } });
            }
            return await flowService.update({ flowId: request.params.flowId, request: request.body, projectId: request.principal.projectId });
        },
    );

    fastify.get(
        '/',
        {
            schema: {
                querystring: ListFlowsRequest,
            },
        },
        async (
            request: FastifyRequest<{
                Querystring: ListFlowsRequest;
            }>,
        ) => {
            return await flowService.list({ projectId: request.principal.projectId, collectionId: request.query.collectionId, cursorRequest: request.query.cursor ?? null, limit: request.query.limit ?? DEFUALT_PAGE_SIZE });
        },
    );

    fastify.get(
        '/:flowId',
        async (
            request: FastifyRequest<{
                Params: {
                    flowId: FlowId;
                };
                Querystring: {
                    versionId: FlowVersionId | undefined;
                    includeArtifacts: boolean | undefined;
                };
            }>,
        ) => {
            const versionId: FlowVersionId | undefined = request.query.versionId;
            const includeArtifacts = request.query.includeArtifacts ?? false;
            const flow = await flowService.getOne({ id: request.params.flowId, versionId: versionId, projectId: request.principal.projectId, includeArtifacts });
            if (flow === null) {
                throw new ActivepiecesError({ code: ErrorCode.FLOW_NOT_FOUND, params: { id: request.params.flowId } });
            }
            return flow;
        },
    );

    fastify.delete(
        '/:flowId',
        async (
            request: FastifyRequest<{
                Params: {
                    flowId: FlowId;
                };
            }>,
            _reply,
        ) => {
            await flowService.delete({ projectId: request.principal.projectId, flowId: request.params.flowId });
            _reply.status(StatusCodes.OK).send();
        },
    );
};
