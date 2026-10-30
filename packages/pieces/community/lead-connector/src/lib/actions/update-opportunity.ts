import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import {
  getOpportunities,
  getOpportunity,
  getPipeline,
  LeadConnectorOpportunityStatus,
  updateOpportunity,
} from '../common';
import { leadConnectorProps } from '../common/props';
import { requestBodyUtils } from '../common/request-body';
import { leadConnectorAuth } from '../..';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';

export const updateOpportunityAction = createAction({
  auth: leadConnectorAuth,
  name: 'update_opportunity',
  classification: 'WRITE',
  displayName: 'Update Opportunity',
  description: 'Updates an existing opportunity.',
  audience: 'both',
  aiMetadata: { description: 'Updates an existing GoHighLevel/LeadConnector opportunity identified by pipeline and opportunity ID, changing stage, status, title, contact, assignee, or monetary value. Omitted stage/title/status are backfilled from the current opportunity. Use to advance or edit a known deal; idempotent — repeating with the same input leaves the opportunity in the same state.', idempotent: true },
  propertyGroups: [
    {
      key: 'opportunity',
      display: 'section',
      label: 'Opportunity to update',
      icon: 'filter',
      props: ['pipeline', 'opportunity', 'changesInfo'],
    },
    {
      key: 'changes',
      display: 'section',
      label: 'Changes',
      icon: 'sliders',
      props: [
        'stage',
        'title',
        'contact',
        'status',
        'monetaryValue',
        'assignedTo',
      ],
    },
  ],
  props: {
    pipeline: leadConnectorProps.pipeline(),
    opportunity: Property.Dropdown({
      auth: leadConnectorAuth,
      displayName: 'Opportunity',
      required: true,
      refreshers: ['pipeline'],
      options: async ({ auth, pipeline }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: CONNECT_FIRST,
          };
        }
        if (typeof pipeline !== 'string' || !pipeline) {
          return {
            disabled: true,
            options: [],
            placeholder: SELECT_PIPELINE_FIRST,
          };
        }

        const opportunities = await getOpportunities(auth, pipeline);
        return {
          options: opportunities.map(
            (opportunity: LeadConnectorOpportunityOption) => {
              return {
                label: opportunity.name,
                value: opportunity.id,
              };
            }
          ),
        };
      },
    }),
    changesInfo: Property.MarkDown({
      value: 'Empty fields keep their current value.',
      variant: MarkdownVariant.INFO,
    }),
    stage: Property.Dropdown({
      auth: leadConnectorAuth,
      displayName: 'Stage',
      required: false,
      refreshers: ['pipeline'],
      options: async ({ auth, pipeline }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: CONNECT_FIRST,
          };
        }
        if (typeof pipeline !== 'string' || !pipeline) {
          return {
            disabled: true,
            options: [],
            placeholder: SELECT_PIPELINE_FIRST,
          };
        }

        const pipelineObj = await getPipeline(auth, pipeline);
        return {
          options: pipelineObj
            ? pipelineObj.stages.map((stage: LeadConnectorStage) => {
                return {
                  label: stage.name,
                  value: stage.id,
                };
              })
            : [],
        };
      },
    }),
    title: Property.ShortText({
      displayName: 'Opportunity Name',
      required: false,
    }),
    contact: leadConnectorProps.contact({ required: false }),
    status: Property.Dropdown({
      auth: leadConnectorAuth,
      displayName: 'Status',
      required: false,
      refreshers: [],
      options: async () => {
        const statuses = Object.values(LeadConnectorOpportunityStatus);

        return {
          options: statuses.map((status) => {
            return {
              label: status.charAt(0).toUpperCase() + status.slice(1),
              value: status,
            };
          }),
        };
      },
    }),
    monetaryValue: Property.Number({
      displayName: 'Value',
      description: "In your account's currency.",
      required: false,
    }),
    assignedTo: leadConnectorProps.user({
      displayName: 'Assigned To',
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      monetaryValue: z.optional(z.number()),
    });

    const {
      pipeline,
      opportunity,
      stage,
      contact,
      status,
      title,
      assignedTo,
      monetaryValue,
    } = propsValue;

    let originalData: any;
    if (!title || !stage || !status)
      originalData = await getOpportunity(
        auth.access_token,
        pipeline,
        opportunity
      );

    return await updateOpportunity(auth.access_token, opportunity, {
      pipelineId: pipeline ?? originalData.pipelineId,
      pipelineStageId: stage ?? originalData.pipelineStageId,
      status: status ?? originalData.status,
      name: title || originalData.name,
      ...requestBodyUtils.omitEmptyValues({
        contactId: contact,
        assignedTo: assignedTo,
        monetaryValue: monetaryValue,
      }),
    });
  },
});

const CONNECT_FIRST = 'Connect your account first';
const SELECT_PIPELINE_FIRST = 'Select a pipeline first';

type LeadConnectorStage = {
  id: string;
  name: string;
};

type LeadConnectorOpportunityOption = {
  id: string;
  name: string;
};
