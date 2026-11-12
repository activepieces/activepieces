import dayjs from 'dayjs';
import { FlowluApiError, FlowluClient } from './client';

async function stageAndCloseFields({
  client,
  opportunityId,
  pipelineId,
  stageId,
  status,
  closingDate,
}: {
  client: FlowluClient;
  opportunityId: number | undefined;
  pipelineId: number | undefined;
  stageId: number | undefined;
  status: number | undefined;
  closingDate: string | undefined;
}): Promise<{
  pipeline_id: number | undefined;
  pipeline_stage_id: number | undefined;
  closing_date: string | undefined;
}> {
  const closing = status === 2 || status === 3;
  const needsStagePipeline = stageId !== undefined && pipelineId === undefined;
  const needsCloseDate = closing && closingDate === undefined;
  if (opportunityId === undefined && needsStagePipeline) {
    throw new FlowluApiError({
      message:
        'Pipeline Stage ID needs Pipeline ID: a stage belongs to one pipeline.',
    });
  }
  const current =
    opportunityId !== undefined && (needsStagePipeline || needsCloseDate)
      ? await client.getRecord<Record<string, unknown>>(
          'crm',
          'lead',
          opportunityId
        )
      : undefined;
  const pipeline = pipelineId ?? positiveNumber(current?.['pipeline_id']);
  if (stageId !== undefined) {
    if (pipeline === undefined) {
      throw new FlowluApiError({
        message:
          'Pipeline Stage ID needs Pipeline ID: this opportunity is not in a pipeline yet.',
      });
    }
    await assertStageInPipeline({ client, pipelineId: pipeline, stageId });
  }
  return {
    pipeline_id: stageId === undefined ? pipelineId : pipeline,
    pipeline_stage_id: stageId,
    closing_date:
      closingDate ??
      (needsCloseDate && !alreadyClosedAs({ current, status })
        ? dayjs().format('YYYY-MM-DD')
        : undefined),
  };
}

async function assertStageInPipeline({
  client,
  pipelineId,
  stageId,
}: {
  client: FlowluClient;
  pipelineId: number;
  stageId: number;
}): Promise<void> {
  for (let page = 1; page <= STAGE_MAX_PAGES; page++) {
    const stages = await client.list<Record<string, unknown>>(
      'crm',
      'pipeline_stage',
      { 'filter[pipeline_id]': pipelineId, limit: STAGE_PAGE_SIZE, page }
    );
    const match = stages.items.find((item) => Number(item['id']) === stageId);
    if (match !== undefined) {
      if (
        match['pipeline_id'] !== undefined &&
        Number(match['pipeline_id']) !== pipelineId
      ) {
        throw stageError({ pipelineId, stageId });
      }
      return;
    }
    const total = Number(stages.total_result ?? stages.total);
    const seen = (page - 1) * STAGE_PAGE_SIZE + stages.items.length;
    const lastPage =
      stages.items.length < STAGE_PAGE_SIZE ||
      (Number.isFinite(total) && seen >= total);
    if (lastPage) {
      throw stageError({ pipelineId, stageId });
    }
  }
  throw new FlowluApiError({
    message: `Could not confirm that Pipeline Stage ID ${stageId} belongs to pipeline ${pipelineId}: the pipeline has more than ${
      STAGE_PAGE_SIZE * STAGE_MAX_PAGES
    } stages. Nothing was changed.`,
  });
}

function stageError({
  pipelineId,
  stageId,
}: {
  pipelineId: number;
  stageId: number;
}): FlowluApiError {
  return new FlowluApiError({
    message: `Pipeline Stage ID ${stageId} is not a stage of pipeline ${pipelineId}. List the pipeline's stages (pipeline_stages) to get a valid ID, or pass the Pipeline ID the stage belongs to.`,
  });
}

function alreadyClosedAs({
  current,
  status,
}: {
  current: Record<string, unknown> | undefined;
  status: number | undefined;
}): boolean {
  if (current === undefined) {
    return false;
  }
  const closedOn = current['closing_date'];
  return (
    Number(current['active']) === status &&
    typeof closedOn === 'string' &&
    closedOn.trim() !== ''
  );
}

function positiveNumber(value: unknown): number | undefined {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : undefined;
}

const STAGE_PAGE_SIZE = 100;
const STAGE_MAX_PAGES = 20;

export const flowluOpportunity = {
  stageAndCloseFields,
};
