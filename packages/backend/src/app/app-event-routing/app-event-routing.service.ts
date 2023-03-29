import { apId, FlowId, ProjectId } from '@activepieces/shared';
import { databaseConnection } from '../database/database-connection';
import { AppEventRouting, AppEventRoutingEntity } from './app-event-routing.entity';
import { logger } from '../helper/logger';
import { SystemProp } from '../helper/system/system-prop';
import { system } from '../helper/system/system';


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
    }): Promise<AppEventRouting[]> {
        logger.info(`Creating listeners for ${appName}, events=${events}, identifierValue=${identifierValue}`);
        const upsertCommands: Promise<AppEventRouting>[] = [];
        events.forEach(event => {
            upsertCommands.push(appEventRoutingRepo.save({
                id: apId(),
                appName,
                event,
                identifierValue,
                flowId,
                projectId,
            }));
        });
        return await Promise.all(upsertCommands);
    },
    async deleteListeners({ projectId, flowId }: { projectId: ProjectId, flowId: FlowId }): Promise<void> {
        appEventRoutingRepo.delete({
            projectId,
            flowId: flowId
        });
    },
    async getAppWebookUrl({ appName }: { appName: string}): Promise<string | undefined> {
        const webhookUrl = system.get(SystemProp.WEBHOOK_URL);
        if(webhookUrl){
            return `${webhookUrl}/v1/app-events/${appName}`;
        }
        const frontendUrl = system.get(SystemProp.FRONTEND_URL);
        return `${frontendUrl}/api/v1/app-events/${appName}`;
    }
}

