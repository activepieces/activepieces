import {
  isNil,
  type FlowVersion,
  type FlowVersionId,
  type ProjectId,
} from '@activepieces/shared';
import type { FastifyBaseLogger } from 'fastify';
import { flowService } from '../../flows/flow/flow.service';
import { flowVersionMigrationService } from '../../flows/flow-version/flow-version-migration.service';
import { flowVersionService } from '../../flows/flow-version/flow-version.service';

export async function getFlowVersionForWorker({
  log,
  versionId,
}: {
  log: FastifyBaseLogger;
  versionId: FlowVersionId;
}): Promise<FlowVersion | null> {
  const flowVersion = await flowVersionService(log).getOne(versionId);
  if (isNil(flowVersion)) {
    return null;
  }

  const flow = await flowService(log).getOneById(flowVersion.flowId);
  if (isNil(flow)) {
    return null;
  }

  return flowVersionMigrationService(log).migrate(
    flowVersion,
    flow.projectId as ProjectId
  );
}
