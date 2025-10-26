import { FastifyBaseLogger } from 'fastify';
import { FlowWebhookEntity } from './flow-webhook-entity';
import { apId, assertNotNullOrUndefined, FlowRun, FlowWebhook, isNil } from '@activepieces/shared';
import { repoFactory } from '../../core/db/repo-factory';
import { webhookService } from '../../webhooks/webhook.service';
import { WebhookFlowVersionToRun } from '../../webhooks/webhook-handler';
import { In } from 'typeorm';
import { flowRepo } from '../flow/flow.repo';
import { flowService } from '../flow/flow.service';

const flowWebhookRepo = repoFactory<FlowWebhook>(FlowWebhookEntity);
export const flowWebhookService = (log: FastifyBaseLogger) => ({
    async createWebhook({
        projectId,
        targetFlowId,
        triggerFlowIds,
    }: CreateFlowWebhookParams): Promise<FlowWebhook> {
        const triggerFlows =
            triggerFlowIds && triggerFlowIds.length > 0
                ? await flowRepo().find({
                      where: { projectId, id: In(triggerFlowIds) },
                  })
                : [];

        const webhook = await flowWebhookRepo().save({
            id: apId(),
            projectId,
            targetFlowId,
            triggerFlows,
        });

        return webhook;
    },

    async deleteWebhook({
        projectId,
        id,
    }: DeleteWebhookParams): Promise<void> {
        await flowWebhookRepo().delete({
            projectId,
            id,
        });
    },

    async triggerWebhooks({
        flowRun,
        projectId,
    }: TriggerWebhooksParams): Promise<void> {
        const flow = await flowService(log).getOneById(flowRun.flowId)
        assertNotNullOrUndefined(flow, 'flow');
        const webhooks = await flowWebhookRepo()
            .createQueryBuilder('flow_webhook')
            .innerJoin('flow_webhook.triggerFlows', 'tf', 'tf.externalId = :flowExternalId', { flowExternalId: flow.externalId })
            .where('flow_webhook.projectId = :projectId', { projectId })
            .getMany();
       
        if (webhooks.length === 0) {
            return;
        }
        await Promise.all(
            webhooks.map((webhook) => {
                return webhookService.handleWebhook({
                    async: true,
                    flowId: webhook.targetFlowId,
                    flowVersionToRun:
                        WebhookFlowVersionToRun.LOCKED_FALL_BACK_TO_LATEST,
                    saveSampleData: false,
                    data: () =>
                        Promise.resolve({
                            body: flowRun,
                            method: 'POST',
                            headers: {},
                            queryParams: {},
                        }),
                    logger: log,
                    execute: true,
                    failParentOnFailure: true,
                });
            })
        );
    },
});

type CreateFlowWebhookParams = {
    projectId: string;
    targetFlowId: string;
    triggerFlowIds: string[];
};

type DeleteWebhookParams = {
    projectId: string;
    id: string;
};

type TriggerWebhooksParams = {
    flowRun: FlowRun;
    projectId: string;
};
