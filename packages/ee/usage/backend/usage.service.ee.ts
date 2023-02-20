import { ActivepiecesError, ErrorCode, FlowVersion, ProjectId, Trigger, Action } from "@activepieces/shared";
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import { createRedisClient } from "@backend/database/redis-connection";
import { ProjectUsage } from "../shared/usage.ee";

const rateLimiterRedis = new RateLimiterRedis({
    storeClient: createRedisClient(),
    points: 5000, // Number of points
    duration: 30 * 24 * 60 * 60, // Per second(s)
    execEvenly: false, // Do not delay actions evenly
    blockDuration: 0, // Do not block if consumed more than points
    keyPrefix: 'rlflx-flow-runs', // must be unique for limiters with different purpose
});

export const usageService = {
    async limit(request: RateLimitRequest): Promise<RateLimiterResponse> {
        const numberOfSteps = countSteps(request.flowVersion);
        try {
            return {
                perform: true,
                info: await rateLimiterRedis.consume(request.projectId, numberOfSteps)
            };
        } catch (e) {
            // Give the point back as it always subtract.
            await rateLimiterRedis.reward(request.projectId, numberOfSteps);
            throw new ActivepiecesError({
                code: ErrorCode.FLOW_RUN_QUOTA_EXCEEDED,
                params: {}
            })
        }
    },
    async getUsage({ projectId }: { projectId: ProjectId }): Promise<ProjectUsage> {
        let result: RateLimiterRes;
        try {
            result = await rateLimiterRedis.consume(projectId, 0);
        } catch (e) {
            if (e instanceof Error) {
                throw e;
            }
            result = e;
        }
        return {
            projectId: projectId,
            metrics: {
                steps: {
                    remaining: result.remainingPoints,
                    consumed: result.consumedPoints,
                    nextResetInMs: result.msBeforeNext
                }
            }
        }
    }
}

export interface RateLimiterResponse {
    perform: boolean;
    info: RateLimiterRes | null;
}

export enum RateLimitOperationType {
    EXECUTE_RUN = "EXECUTE_RUN"
}

export interface RateLimitRequest {
    operation: RateLimitOperationType;
    projectId: ProjectId;
    flowVersion: FlowVersion;
}

function countSteps(flowVersion: FlowVersion): number {
    let steps = 0;
    let currentStep: Trigger | Action | undefined = flowVersion.trigger;
    while (currentStep !== undefined) {
        currentStep = currentStep.nextAction;
        steps++;
    }
    return steps;
}