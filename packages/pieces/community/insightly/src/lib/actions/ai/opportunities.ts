import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { InsightlyError, insightlyUtils } from '../../common/client';
import { insightlyAuth, insightlyCommon } from '../../common/common';
import { insightlyMappers, outputSchemas } from '../../common/output-schemas';
import { aiProps, OPPORTUNITY_STATE_OPTIONS } from '../../common/props';

export const aiFindOpportunities = createAction({
  auth: insightlyAuth,
  name: 'ai_find_opportunities',
  classification: 'SEARCH',
  displayName: 'Find Opportunities',
  description: 'Find opportunities by exact name or state.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Insightly opportunities (deals) by exact name and/or state (OPEN, WON, LOST, ABANDONED, SUSPENDED); lists them when no filter is given. Returns IDs, value, pipeline and stage. Read-only and safe to repeat.',
    idempotent: true,
  },
  outputSchema: outputSchemas['opportunityList'],
  props: {
    name: Property.ShortText({ displayName: 'Name', required: false }),
    state: Property.StaticDropdown<string, false>({ displayName: 'State', required: false, options: { options: OPPORTUNITY_STATE_OPTIONS } }),
    limit: aiProps.limit(),
  },
  async run({ auth, propsValue }) {
    const name = insightlyUtils.optionalText(propsValue.name);
    const state = insightlyUtils.optionalText(propsValue.state);
    const limit = insightlyUtils.clampLimit(propsValue.limit);
    const filter = name ? { field: 'OPPORTUNITY_NAME', value: name } : state ? { field: 'OPPORTUNITY_STATE', value: state } : undefined;
    const scanForState = name !== undefined && state !== undefined;
    const connection = await insightlyCommon.connect({ auth });
    const page = await insightlyCommon.findRecords({ connection, objectName: 'Opportunities', filter, limit: scanForState ? MAX_SCAN : limit });
    const opportunities = page.records.map(insightlyMappers.opportunity).filter((opportunity) => !scanForState || (opportunity.state ?? '').toUpperCase() === state);
    return { count: Math.min(opportunities.length, limit), hasMore: page.hasMore || opportunities.length > limit, opportunities: opportunities.slice(0, limit) };
  },
});

export const aiCreateOpportunity = createAction({
  auth: insightlyAuth,
  name: 'ai_create_opportunity',
  classification: 'WRITE',
  displayName: 'Create Opportunity',
  description: 'Create an opportunity.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new Insightly opportunity (deal), optionally placed in a pipeline stage. Not idempotent: each call creates another opportunity, so run Find Opportunities first. Get pipeline and stage IDs from Find Pipeline Stage by Name or List Pipelines.',
    idempotent: false,
  },
  outputSchema: outputSchemas['opportunity'],
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    value: Property.Number({ displayName: 'Value', required: false }),
    currency: Property.ShortText({ displayName: 'Currency', description: 'ISO code, e.g. USD.', required: false }),
    closeDate: Property.ShortText({ displayName: 'Forecast Close Date', description: 'YYYY-MM-DD', required: false }),
    probability: Property.Number({ displayName: 'Probability (%)', required: false }),
    organisationId: Property.Number({ displayName: 'Organization ID', required: false }),
    pipelineId: Property.Number({ displayName: 'Pipeline ID', required: false }),
    stageId: Property.Number({ displayName: 'Stage ID', required: false }),
  },
  async run({ auth, propsValue }) {
    const hasPipeline = propsValue.pipelineId !== undefined && propsValue.pipelineId !== null;
    const hasStage = propsValue.stageId !== undefined && propsValue.stageId !== null;
    if (hasPipeline !== hasStage) {
      throw new Error('Provide both Pipeline ID and Stage ID, or neither.');
    }
    const stagePlacement = hasPipeline && hasStage
      ? { pipelineId: insightlyUtils.toId({ value: propsValue.pipelineId, label: 'Pipeline ID' }), stageId: insightlyUtils.toId({ value: propsValue.stageId, label: 'Stage ID' }) }
      : null;
    const connection = await insightlyCommon.connect({ auth });
    if (stagePlacement) {
      await insightlyCommon.assertStageInPipeline({ connection, ...stagePlacement });
    }
    const created = insightlyUtils.sanitizeRecord(
      await insightlyCommon.call({
        connection,
        method: HttpMethod.POST,
        path: '/Opportunities',
        body: insightlyUtils.compact({
          OPPORTUNITY_NAME: propsValue.name,
          OPPORTUNITY_STATE: 'OPEN',
          BID_AMOUNT: propsValue.value,
          BID_CURRENCY: propsValue.currency,
          BID_TYPE: propsValue.value === undefined || propsValue.value === null ? undefined : 'Fixed Bid',
          FORECAST_CLOSE_DATE: propsValue.closeDate,
          PROBABILITY: propsValue.probability,
          ORGANISATION_ID: propsValue.organisationId,
        }),
      }),
    );
    if (!stagePlacement) {
      return insightlyMappers.opportunity(created);
    }
    const id = insightlyUtils.readNumber(created['OPPORTUNITY_ID']);
    if (id === null) {
      throw new InsightlyError({ message: 'Insightly created the opportunity but returned no ID, so the pipeline stage could not be set.', status: 502 });
    }
    try {
      await insightlyCommon.setPipelineStage({ connection, objectName: 'Opportunities', recordId: id, ...stagePlacement });
      if (propsValue.probability !== undefined && propsValue.probability !== null) {
        await insightlyCommon.updateFields({ connection, objectName: 'Opportunities', recordId: id, fields: { PROBABILITY: propsValue.probability } });
      }
    } catch (error) {
      const cause = insightlyUtils.toInsightlyError(error);
      throw new InsightlyError({ message: `Opportunity ${id} was created, but setting its pipeline stage failed: ${cause.message}`, status: cause.status, responseBody: cause.responseBody });
    }
    const refreshed = insightlyUtils.sanitizeRecord(await insightlyCommon.call({ connection, method: HttpMethod.GET, path: `/Opportunities/${id}` }));
    return insightlyMappers.opportunity(refreshed);
  },
});

export const aiUpdateOpportunity = createAction({
  auth: insightlyAuth,
  name: 'ai_update_opportunity',
  classification: 'WRITE',
  displayName: 'Update Opportunity',
  description: 'Update fields on an opportunity.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates only the given fields of an Insightly opportunity: name, state (e.g. mark WON or LOST), value, close date, probability. Fields left empty are unchanged; repeating the call is safe. To change the pipeline stage use Set Opportunity Stage.',
    idempotent: true,
  },
  outputSchema: outputSchemas['updatedOpportunity'],
  props: {
    opportunityId: Property.Number({ displayName: 'Opportunity ID', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    state: Property.StaticDropdown<string, false>({ displayName: 'State', required: false, options: { options: OPPORTUNITY_STATE_OPTIONS } }),
    value: Property.Number({ displayName: 'Value', required: false }),
    closeDate: Property.ShortText({ displayName: 'Forecast Close Date', description: 'YYYY-MM-DD', required: false }),
    probability: Property.Number({ displayName: 'Probability (%)', required: false }),
  },
  async run({ auth, propsValue }) {
    const opportunityId = insightlyUtils.toId({ value: propsValue.opportunityId, label: 'Opportunity ID' });
    const connection = await insightlyCommon.connect({ auth });
    const updatedFields = await insightlyCommon.updateFields({
      connection,
      objectName: 'Opportunities',
      recordId: opportunityId,
      fields: {
        OPPORTUNITY_NAME: propsValue.name,
        OPPORTUNITY_STATE: propsValue.state,
        BID_AMOUNT: propsValue.value,
        FORECAST_CLOSE_DATE: propsValue.closeDate,
        PROBABILITY: propsValue.probability,
      },
    });
    return { id: opportunityId, updatedFields };
  },
});

export const aiSetOpportunityStage = createAction({
  auth: insightlyAuth,
  name: 'ai_set_opportunity_stage',
  classification: 'WRITE',
  displayName: 'Set Opportunity Stage',
  description: 'Move an opportunity to a pipeline stage.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Moves an Insightly opportunity into the given pipeline and stage (switching pipeline when needed). Checks the stage belongs to the pipeline. Repeating the call leaves the same stage. Get IDs from Find Pipeline Stage by Name.',
    idempotent: true,
  },
  outputSchema: outputSchemas['stageChange'],
  props: {
    opportunityId: Property.Number({ displayName: 'Opportunity ID', required: true }),
    pipelineId: Property.Number({ displayName: 'Pipeline ID', required: true }),
    stageId: Property.Number({ displayName: 'Stage ID', required: true }),
  },
  async run({ auth, propsValue }) {
    const opportunityId = insightlyUtils.toId({ value: propsValue.opportunityId, label: 'Opportunity ID' });
    const pipelineId = insightlyUtils.toId({ value: propsValue.pipelineId, label: 'Pipeline ID' });
    const stageId = insightlyUtils.toId({ value: propsValue.stageId, label: 'Stage ID' });
    const connection = await insightlyCommon.connect({ auth });
    await insightlyCommon.setPipelineStage({ connection, objectName: 'Opportunities', recordId: opportunityId, pipelineId, stageId });
    return { opportunityId, pipelineId, stageId };
  },
});

const MAX_SCAN = 500;
