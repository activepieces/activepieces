import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { insightlyClient, InsightlyError, insightlyUtils } from '../../common/client';
import { insightlyAuth, insightlyCommon, InsightlyConnection } from '../../common/common';
import { outputSchemas } from '../../common/output-schemas';
import { aiProps, CATEGORY_OBJECT_OPTIONS, PIPELINE_OBJECT_OPTIONS } from '../../common/props';

const { readString, readNumber, readBoolean } = insightlyUtils;

async function listAll({ connection, path }: { connection: InsightlyConnection; path: string }): Promise<Record<string, unknown>[]> {
  const { records } = await insightlyClient.paginate({ apiKey: connection.apiKey, pod: connection.pod, path });
  return records.map(insightlyUtils.sanitizeRecord);
}

async function loadPipelines({ connection, objectType }: { connection: InsightlyConnection; objectType: string }) {
  const flag = objectType === 'Projects' ? 'FOR_PROJECTS' : 'FOR_OPPORTUNITIES';
  const [pipelines, stages] = await Promise.all([listAll({ connection, path: '/Pipelines' }), listAll({ connection, path: '/PipelineStages' })]);
  return pipelines
    .filter((pipeline) => pipeline[flag] !== false)
    .map((pipeline) => {
      const id = readNumber(pipeline['PIPELINE_ID']);
      return {
        id,
        name: readString(pipeline['PIPELINE_NAME']),
        stages: stages
          .filter((stage) => readNumber(stage['PIPELINE_ID']) === id)
          .map((stage) => ({ id: readNumber(stage['STAGE_ID']), name: readString(stage['STAGE_NAME']), order: readNumber(stage['STAGE_ORDER']) }))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      };
    });
}

function sameText({ left, right }: { left: string | null; right: string }): boolean {
  return (left ?? '').trim().toLowerCase() === right.trim().toLowerCase();
}

export const aiListPipelines = createAction({
  auth: insightlyAuth,
  name: 'ai_list_pipelines',
  classification: 'SEARCH',
  displayName: 'List Pipelines',
  description: 'List pipelines and their stages.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists Insightly opportunity or project pipelines with their stages in order, giving the pipeline and stage IDs needed by Set Opportunity Stage and Create Opportunity. Read-only.',
    idempotent: true,
  },
  outputSchema: outputSchemas['pipelines'],
  props: {
    objectType: aiProps.objectType({ options: PIPELINE_OBJECT_OPTIONS, description: 'Pipelines for opportunities or projects.' }),
  },
  async run({ auth, propsValue }) {
    const connection = await insightlyCommon.connect({ auth });
    return { pipelines: await loadPipelines({ connection, objectType: propsValue.objectType }) };
  },
});

export const aiFindPipelineStageByName = createAction({
  auth: insightlyAuth,
  name: 'ai_find_pipeline_stage_by_name',
  classification: 'READ',
  displayName: 'Find Pipeline Stage by Name',
  description: 'Resolve a pipeline and stage name to IDs.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Resolves an Insightly pipeline name and stage name (exact, case-insensitive) to their IDs for Set Opportunity Stage. Returns found=false when no match. Fails if two pipelines share the name. Read-only.',
    idempotent: true,
  },
  outputSchema: outputSchemas['stageLookup'],
  props: {
    objectType: aiProps.objectType({ options: PIPELINE_OBJECT_OPTIONS, description: 'Pipelines for opportunities or projects.' }),
    pipelineName: Property.ShortText({ displayName: 'Pipeline Name', required: true }),
    stageName: Property.ShortText({ displayName: 'Stage Name', required: true }),
  },
  async run({ auth, propsValue }) {
    const connection = await insightlyCommon.connect({ auth });
    const pipelines = (await loadPipelines({ connection, objectType: propsValue.objectType })).filter((pipeline) => sameText({ left: pipeline.name, right: propsValue.pipelineName }));
    if (pipelines.length > 1) {
      throw new InsightlyError({ message: `More than one pipeline is named "${propsValue.pipelineName}"; use List Pipelines and pick the ID.`, status: 409 });
    }
    const pipeline = pipelines[0];
    const stage = pipeline?.stages.find((candidate) => sameText({ left: candidate.name, right: propsValue.stageName }));
    if (!pipeline || !stage) {
      return { found: false, pipelineId: pipeline?.id ?? null, stageId: null };
    }
    return { found: true, pipelineId: pipeline.id, stageId: stage.id };
  },
});

export const aiFindUser = createAction({
  auth: insightlyAuth,
  name: 'ai_find_user',
  classification: 'READ',
  displayName: 'Find User',
  description: 'Resolve a user email or name to a user ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Resolves an Insightly user (team member) by exact email or exact full name (case-insensitive) to a single user ID for owner or assignee fields. Leave both empty to get the connected user. Returns found=false when no match and fails listing the candidates when several users share the name. Read-only.',
    idempotent: true,
  },
  outputSchema: outputSchemas['user'],
  props: {
    email: Property.ShortText({ displayName: 'Email', required: false }),
    name: Property.ShortText({ displayName: 'Full Name', required: false }),
  },
  async run({ auth, propsValue }) {
    const email = insightlyUtils.optionalText(propsValue.email);
    const name = insightlyUtils.optionalText(propsValue.name);
    const connection = await insightlyCommon.connect({ auth });
    const users =
      email === undefined && name === undefined
        ? [insightlyUtils.sanitizeRecord(await insightlyCommon.call({ connection, method: HttpMethod.GET, path: '/Users/Me' }))]
        : await listAll({ connection, path: '/Users' });
    const matchesUser = (candidate: Record<string, unknown>) => {
      if (email !== undefined) {
        return sameText({ left: readString(candidate['EMAIL_ADDRESS']), right: email });
      }
      if (name !== undefined) {
        return sameText({ left: insightlyCommon.recordNameOf(candidate), right: name });
      }
      return true;
    };
    const candidates = users.filter(matchesUser);
    if (candidates.length > 1) {
      const listed = candidates.map((candidate) => `${insightlyCommon.recordNameOf(candidate) ?? 'Unknown'} <${readString(candidate['EMAIL_ADDRESS']) ?? 'no email'}> (ID ${readNumber(candidate['USER_ID'])})`).join('; ');
      throw new InsightlyError({ message: `More than one user matches; search by email instead. Candidates: ${listed}`, status: 409 });
    }
    const user = candidates[0];
    if (!user) {
      return { found: false, userId: null, name: null, email: null };
    }
    return { found: true, userId: readNumber(user['USER_ID']), name: insightlyCommon.recordNameOf(user), email: readString(user['EMAIL_ADDRESS']) };
  },
});

export const aiListCategories = createAction({
  auth: insightlyAuth,
  name: 'ai_list_categories',
  classification: 'SEARCH',
  displayName: 'List Categories',
  description: 'List opportunity, project or task categories.',
  audience: 'ai',
  aiMetadata: { description: 'Lists Insightly categories for opportunities, projects or tasks with their IDs and active flag. Read-only.', idempotent: true },
  outputSchema: outputSchemas['categories'],
  props: {
    objectType: aiProps.objectType({ options: CATEGORY_OBJECT_OPTIONS, description: 'Which object the categories belong to.' }),
  },
  async run({ auth, propsValue }) {
    const path = CATEGORY_PATHS[propsValue.objectType];
    if (!path) {
      throw new InsightlyError({ message: 'Choose Opportunities, Projects or Tasks.', status: 400 });
    }
    const connection = await insightlyCommon.connect({ auth });
    const categories = (await listAll({ connection, path })).map((category) => ({
      id: readNumber(category['CATEGORY_ID']),
      name: readString(category['CATEGORY_NAME']),
      active: readBoolean(category['ACTIVE']),
    }));
    return { categories };
  },
});

export const aiListLeadSourcesStatuses = createAction({
  auth: insightlyAuth,
  name: 'ai_list_lead_sources_statuses',
  classification: 'SEARCH',
  displayName: 'List Lead Sources and Statuses',
  description: 'List lead sources and lead statuses.',
  audience: 'ai',
  aiMetadata: { description: 'Lists Insightly lead sources and lead statuses with their IDs, for Create Lead. Read-only.', idempotent: true },
  outputSchema: outputSchemas['leadSourcesStatuses'],
  props: {},
  async run({ auth }) {
    const connection = await insightlyCommon.connect({ auth });
    const [sources, statuses] = await Promise.all([listAll({ connection, path: '/LeadSources' }), listAll({ connection, path: '/LeadStatuses' })]);
    return {
      sources: sources.map((source) => ({ id: readNumber(source['LEAD_SOURCE_ID']), name: readString(source['LEAD_SOURCE']) })),
      statuses: statuses.map((status) => ({ id: readNumber(status['LEAD_STATUS_ID']), name: readString(status['LEAD_STATUS']) })),
    };
  },
});

const CATEGORY_PATHS: Record<string, string> = {
  Opportunities: '/OpportunityCategories',
  Projects: '/ProjectCategories',
  Tasks: '/TaskCategories',
};
