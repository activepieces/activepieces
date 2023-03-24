import { apId, Cursor, FlowId, FlowVersion, ListenForTriggerEventsRequest, PieceTrigger, ProjectId, SeekPage, Trigger, TriggerEvent , TriggerType} from "@activepieces/shared";
import { databaseConnection } from "../../database/database-connection";
import { buildPaginator } from "../../helper/pagination/build-paginator";
import { paginationHelper } from "../../helper/pagination/pagination-utils";
import { Order } from "../../helper/pagination/paginator";
import { flowService } from "../flow.service";
import { TriggerEventEntity } from "./trigger-event.entity";

const triggerEventrepo = databaseConnection.getRepository(TriggerEventEntity);

export const triggerEventService = {
    async test(flowVersion: FlowVersion, request: ListenForTriggerEventsRequest): Promise<void> {
        const trigger = flowVersion.trigger;
        // TODO: Implement this
        switch (trigger.type) {
        case TriggerType.WEBHOOK:
            break;
        case TriggerType.PIECE:
            throw new Error("Not implemented");
        case TriggerType.EMPTY:
            break;
        }
    },
    async saveEvent({projectId, flowId, payload}:{projectId: ProjectId, flowId: FlowId, payload: unknown}): Promise<TriggerEvent> {
        const flow = await flowService.getOne({projectId: projectId, id: flowId, versionId: undefined, includeArtifacts: false});
        const sourceName = getSourceName(flow.version.trigger);
        return triggerEventrepo.save({
            id: apId(),
            projectId,
            flowId: flow.id,
            sourceName,
            payload,
        });  
    },
    async list({projectId, flowVersion, cursor, limit}: {projectId: ProjectId, flowVersion: FlowVersion, cursor: Cursor | null, limit: number}): Promise<SeekPage<TriggerEvent>> {
        const decodedCursor = paginationHelper.decodeCursor(cursor);
        const sourceName = getSourceName(flowVersion.trigger);
        const flowId = flowVersion.flowId;
        const paginator = buildPaginator({
            entity: TriggerEventEntity,
            paginationKeys: ["created"],
            query: {
                limit,
                order: Order.DESC,
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        });
        const query = triggerEventrepo.createQueryBuilder("trigger_event").where({
            projectId,
            flowId,
            sourceName,
        });
        const { data, cursor: newCursor } = await paginator.paginate(query);
        return paginationHelper.createPage<TriggerEvent>(data, newCursor);
    }
}

function getSourceName(trigger: Trigger): string {
    switch (trigger.type) {
    case TriggerType.WEBHOOK:
        return TriggerType.WEBHOOK;
    case TriggerType.PIECE:{
        const pieceTrigger = trigger as PieceTrigger;
        return pieceTrigger.settings.pieceName +"@" + pieceTrigger.settings.pieceVersion + ":" + pieceTrigger.settings.triggerName;
    }
    case TriggerType.EMPTY:
        return TriggerType.EMPTY;
    }
}