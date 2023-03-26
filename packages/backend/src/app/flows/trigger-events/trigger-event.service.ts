import { apId, Cursor, Flow, FlowId, FlowVersion, PieceTrigger, ProjectId, SeekPage, Trigger, TriggerEvent , TriggerHookType, TriggerType} from "@activepieces/shared";
import { databaseConnection } from "../../database/database-connection";
import { engineHelper } from "../../helper/engine-helper";
import { buildPaginator } from "../../helper/pagination/build-paginator";
import { paginationHelper } from "../../helper/pagination/pagination-utils";
import { Order } from "../../helper/pagination/paginator";
import { webhookService } from "../../webhooks/webhook-service";
import { flowService } from "../flow.service";
import { TriggerEventEntity } from "./trigger-event.entity";

const triggerEventrepo = databaseConnection.getRepository(TriggerEventEntity);

export const triggerEventService = {
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
    async test({projectId, flow}: {projectId: ProjectId, flow: Flow}): Promise<SeekPage<unknown>> {
        const trigger = flow.version.trigger;
        const emptyPage = paginationHelper.createPage<TriggerEvent>([], null);
        switch (trigger.type) {
        case TriggerType.WEBHOOK:
            throw new Error("Cannot be tested");
        case TriggerType.PIECE: {
            const testResult =( await engineHelper.executeTrigger({
                hookType: TriggerHookType.TEST,
                flowVersion: flow.version,
                collectionId: flow.collectionId,
                webhookUrl: await webhookService.getWebhookUrl(projectId),
                projectId: projectId
            }) )as unknown[];
            await triggerEventrepo.delete({
                projectId,
                flowId: flow.id,
            });
            for(let i = 0; i < testResult.length; i++) {
                await triggerEventService.saveEvent({
                    projectId,
                    flowId: flow.id,
                    payload: testResult[i]
                });
            }
            return triggerEventService.list({
                projectId,
                flow,
                cursor: null,
                limit: testResult.length
            });
        }
        case TriggerType.EMPTY:
            return emptyPage;
        }
    },
    async list({projectId, flow, cursor, limit}: ListParams): Promise<SeekPage<TriggerEvent>> {
        const decodedCursor = paginationHelper.decodeCursor(cursor);
        const sourceName = getSourceName(flow.version.trigger);
        const flowId = flow.id;
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

interface ListParams {
    projectId: ProjectId;
    flow: Flow; 
    cursor: Cursor | null;
    limit: number;
}