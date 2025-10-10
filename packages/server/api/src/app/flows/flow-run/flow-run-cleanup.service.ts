import {
  CleanupReason,
  FlowRun,
  FlowRunStatus,
  FlowVersion,
  isNil,
  PieceAction,
  StepOutputStatus,
} from '@activepieces/shared';
import { FastifyBaseLogger } from 'fastify';
import { engineRunner } from '@activepieces/server-worker';
import { flowVersionService } from '../flow-version/flow-version.service';
import { accessTokenManager } from '../../authentication/lib/access-token-manager';
import { projectService } from '../../project/project-service';

export const flowRunCleanupService = (log: FastifyBaseLogger) => ({
  async invokeCleanupForPausedSteps(flowRun: FlowRun): Promise<void> {
    log.info(
      {
        flowRunId: flowRun.id,
        status: flowRun.status,
      },
      '[flowRunCleanupService#invokeCleanupForPausedSteps]',
    );

    if (isNil(flowRun.pauseMetadata)) {
      return;
    }

    const flowVersion = await flowVersionService(log).getOneOrThrow(
      flowRun.flowVersionId,
    );
    const cleanupReason = mapStatusToCleanupReason(flowRun.status);
    const pausedSteps = findPausedSteps(flowRun, flowVersion);

    if (pausedSteps.length === 0) {
      log.debug({ flowRunId: flowRun.id }, 'No paused steps found');
      return;
    }

    for (const step of pausedSteps) {
      await invokeCleanupForStep({
        log,
        flowRun,
        flowVersion,
        step,
        cleanupReason,
      });
    }
  },
});

function mapStatusToCleanupReason(status: FlowRunStatus): CleanupReason {
  if (status === FlowRunStatus.TIMEOUT) {
    return CleanupReason.TIMEOUT;
  }

  return CleanupReason.FAILURE;
}

function findPausedSteps(
  flowRun: FlowRun,
  flowVersion: FlowVersion,
): PieceAction[] {
  const pausedSteps: PieceAction[] = [];

  if (isNil(flowRun.steps)) {
    return pausedSteps;
  }

  for (const [stepName, stepOutput] of Object.entries(flowRun.steps)) {
    if (stepOutput.status === StepOutputStatus.PAUSED) {
      const step = findStepInFlowVersion(flowVersion, stepName);
      if (step && step.type === 'PIECE') {
        pausedSteps.push(step as PieceAction);
      }
    }
  }

  return pausedSteps;
}

function findStepInFlowVersion(
  flowVersion: FlowVersion,
  stepName: string,
): PieceAction | undefined {
  const searchInAction = (action: any): any => {
    if (isNil(action)) {
      return undefined;
    }

    if (action.name === stepName) {
      return action;
    }

    if (action.nextAction) {
      const found = searchInAction(action.nextAction);
      if (found) return found;
    }

    if (action.onFailureAction) {
      const found = searchInAction(action.onFailureAction);
      if (found) return found;
    }

    if (action.onSuccessAction) {
      const found = searchInAction(action.onSuccessAction);
      if (found) return found;
    }

    if (action.settings?.branches) {
      for (const branch of action.settings.branches) {
        if (branch.branchName === stepName) {
          return action;
        }
        const found = searchInAction(branch.firstAction);
        if (found) return found;
      }
    }

    if (action.settings?.firstLoopAction) {
      const found = searchInAction(action.settings.firstLoopAction);
      if (found) return found;
    }

    return undefined;
  };

  return searchInAction(flowVersion.trigger.nextAction);
}

async function invokeCleanupForStep(params: {
  log: FastifyBaseLogger;
  flowRun: FlowRun;
  flowVersion: FlowVersion;
  step: PieceAction;
  cleanupReason: CleanupReason;
}): Promise<void> {
  const { log, flowRun, flowVersion, step, cleanupReason } = params;

  try {
    log.info(
      {
        flowRunId: flowRun.id,
        stepName: step.name,
        pieceName: step.settings.pieceName,
        actionName: step.settings.actionName,
        cleanupReason,
      },
      '[flowRunCleanupService] Invoking cleanup for step',
    );

    const stepInput = flowRun.steps?.[step.name]?.input || {};
    const platformId = await projectService.getPlatformId(flowRun.projectId);
    const engineToken = await accessTokenManager.generateEngineToken({
      jobId: `cleanup-${flowRun.id}-${step.name}`,
      projectId: flowRun.projectId,
      platformId,
    });

    const result = await engineRunner(log).executeCleanup(engineToken, {
      projectId: flowRun.projectId,
      piece: {
        pieceName: step.settings.pieceName,
        pieceVersion: step.settings.pieceVersion,
        pieceType: step.settings.pieceType,
        packageType: step.settings.packageType,
      },
      actionName: step.settings.actionName!,
      flowVersion,
      cleanupReason,
      input: stepInput as Record<string, unknown>,
      timeoutInSeconds: 30,
    });

    if (result.status === 'OK' && result.response.success) {
      log.info(
        {
          flowRunId: flowRun.id,
          stepName: step.name,
        },
        '[flowRunCleanupService] Cleanup completed successfully',
      );
    } else {
      log.warn(
        {
          flowRunId: flowRun.id,
          stepName: step.name,
          error: result.response.message,
        },
        '[flowRunCleanupService] Cleanup failed',
      );
    }
  } catch (error) {
    log.error(
      {
        flowRunId: flowRun.id,
        stepName: step.name,
        error,
      },
      '[flowRunCleanupService] Error invoking cleanup',
    );
    // Cleanup failures should not prevent flow termination.
  }
}
