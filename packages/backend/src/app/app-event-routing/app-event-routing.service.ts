import { FlowId, ProjectId } from "@activepieces/shared";
import { databaseConnection } from "../database/database-connection";
import { InsertResult } from "typeorm";
import { AppEventRouting, AppEventRoutingEntity } from "./app-event-routing.entity";


const appEventRoutingRepo = databaseConnection.getRepository(AppEventRoutingEntity);

export const appEventRoutingService = {
    async listListeners({ appName, event, identifierValue }: { appName: string, event: string, identifierValue: string }): Promise<AppEventRouting[]> {
        return await appEventRoutingRepo.findBy({ appName, event, identifierValue });
    },
    async createListeners({ appName, events, identifierValue, flowId, projectId }: {
        appName: string,
        events: string[],
        identifierValue: string,
        flowId: FlowId,
        projectId: ProjectId
    }): Promise<void> {
        const upsertCommands: Promise<InsertResult>[] = [];
        events.forEach(event => {
            upsertCommands.push(appEventRoutingRepo.upsert({
                appName,
                event,
                identifierValue,
                flowId,
                projectId,
            }, ["appName", "event", "flowId", "projectId"]));
        });
        await Promise.all(upsertCommands);
    },
    async deleteListeners({ projectId, flowId }: { projectId: ProjectId, flowId: FlowId }): Promise<void> {
        appEventRoutingRepo.delete({
            projectId,
            flowId: flowId
        });
    }
}

