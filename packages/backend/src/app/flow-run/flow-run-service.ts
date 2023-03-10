import {
    apId,
    Cursor,
    ExecutionOutputStatus,
    FileId,
    FlowRun,
    FlowRunId,
    FlowVersionId,
    ProjectId,
    SeekPage,
    RunEnvironment,
    CollectionId,
    ActivepiecesError,
    ErrorCode,
    Collection,
    TelemetryEventName,
    ApEdition
} from "@activepieces/shared";
import { getEdition } from "../helper/license-helper";
import { collectionRepo } from "../collections/collection.service";
import { databaseConnection } from "../database/database-connection";
import { flowVersionService } from "../flows/flow-version/flow-version.service";
import { buildPaginator } from "../helper/pagination/build-paginator";
import { paginationHelper } from "../helper/pagination/pagination-utils";
import { Order } from "../helper/pagination/paginator";
import { telemetry } from "../helper/telemetry.utils";
import { FlowRunEntity } from "./flow-run-entity";
import { flowRunSideEffects } from "./flow-run-side-effects";
import { usageService } from "@ee/billing/backend/usage.service";

export const repo = databaseConnection.getRepository(FlowRunEntity);

export const flowRunService = {
    async list({ projectId, cursor, limit }: ListParams): Promise<SeekPage<FlowRun>> {
        const decodedCursor = paginationHelper.decodeCursor(cursor);
        const paginator = buildPaginator({
            entity: FlowRunEntity,
            paginationKeys: ["created"],
            query: {
                limit,
                order: Order.DESC,
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        });

        const query = repo.createQueryBuilder("flow_run").where({
            projectId,
            environment: RunEnvironment.PRODUCTION
        });
        const { data, cursor: newCursor } = await paginator.paginate(query);
        return paginationHelper.createPage<FlowRun>(data, newCursor);
    },

    async finish(
        flowRunId: FlowRunId,
        status: ExecutionOutputStatus,
        logsFileId: FileId | null
    ): Promise<FlowRun | null> {
        await repo.update(flowRunId, {
            logsFileId,
            status,
            finishTime: new Date().toISOString(),
        });
        return await this.getOne({ id: flowRunId });
    },

    async start({ flowVersionId, collectionId, payload, environment }: StartParams): Promise<FlowRun> {
        console.log(`[flowRunService#start]  flowVersionId=${flowVersionId} collectionVersionId=${flowVersionId}`);

        const flowVersion = await flowVersionService.getOneOrThrow(flowVersionId);
        const collection = await getCollectionOrThrowWithoutProjectId(collectionId);

        const edition = await getEdition();
        if (edition === ApEdition.ENTERPRISE) {
            await usageService.limit({
                projectId: collection.projectId,
                flowVersion: flowVersion
            });
        }

        const flowRun: Partial<FlowRun> = {
            id: apId(),
            projectId: collection.projectId,
            collectionId: collection.id,
            flowId: flowVersion.flowId,
            flowVersionId: flowVersion.id,
            environment: environment,
            flowDisplayName: flowVersion.displayName,
            collectionDisplayName: collection.displayName,
            status: ExecutionOutputStatus.RUNNING,
            startTime: new Date().toISOString(),
        };

        const savedFlowRun = await repo.save(flowRun);

        telemetry.trackProject(flowRun.projectId, {
            name: TelemetryEventName.FLOW_RUN_CREATED,
            payload: {
                projectId: flowRun.projectId,
                collectionId: flowRun.collectionId,
                flowId: flowVersion.flowId,
                environment: flowRun.environment
            }
        })
        await flowRunSideEffects.start({
            flowRun: savedFlowRun,
            payload,
        });

        return savedFlowRun;
    },

    async getOne({ projectId, id }: GetOneParams): Promise<FlowRun | null> {
        return await repo.findOneBy({
            projectId,
            id,
        });
    },
};


async function getCollectionOrThrowWithoutProjectId(collectionId: CollectionId): Promise<Collection> {
    const collection = await collectionRepo.findOneBy({ id: collectionId });

    if (collection === null) {
        throw new ActivepiecesError({
            code: ErrorCode.COLLECTION_NOT_FOUND,
            params: {
                id: collectionId
            },
        });
    }
    return collection;
};

interface ListParams {
    projectId: ProjectId;
    cursor: Cursor | null;
    limit: number;
}

interface GetOneParams {
    id: FlowRunId;
    projectId: ProjectId;
}

interface StartParams {
    environment: RunEnvironment;
    flowVersionId: FlowVersionId;
    collectionId: CollectionId;
    payload: unknown;
}
