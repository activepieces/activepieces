import { createAction, Property } from '@activepieces/pieces-framework';
import {
  createOpportunity,
  getPipeline,
  LeadConnectorOpportunityStatus,
} from '../common';
import { leadConnectorProps } from '../common/props';
import { leadConnectorAuth } from '../..';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';

export const createOpportunityAction = createAction({
  auth: leadConnectorAuth,
  name: 'create_opportunity',
  classification: 'WRITE',
  displayName: 'Create Opportunity',
  description: 'Create a new opportunity.',
  audience: 'both',
  aiMetadata: { description: 'Creates a new sales opportunity in a GoHighLevel/LeadConnector pipeline, tied to a contact and placed in a chosen pipeline stage with a status (open/won/lost/abandoned). Use to start tracking a deal. Requires pipeline, stage, title, contact, and status; not idempotent — each call creates a separate opportunity.', idempotent: false },
  propertyGroups: [
    {
      key: 'pipeline',
      display: 'section',
      label: 'Pipeline and stage',
      icon: 'filter',
      props: ['pipeline', 'stage'],
    },
    {
      key: 'deal',
      display: 'section',
      label: 'Opportunity',
      icon: 'file',
      props: ['title', 'contact', 'status', 'monetaryValue', 'assignedTo'],
    },
  ],
  props: {
    pipeline: leadConnectorProps.pipeline(),
    stage: Property.Dropdown({
      auth: leadConnectorAuth,
      displayName: 'Stage',
      required: true,
      refreshers: ['pipeline'],
      options: async ({ auth, pipeline }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Connect your account first',
          };
        }
        if (typeof pipeline !== 'string' || !pipeline) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Select a pipeline first',
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
      required: true,
    }),
    contact: leadConnectorProps.contact({ required: true }),
    status: Property.Dropdown({
      auth: leadConnectorAuth,
      displayName: 'Status',
      required: true,
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
      description: 'Leave empty to keep it unassigned.',
      required: false,
    }),
  },

  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      monetaryValue: z.optional(z.number()),
    });

    const {
      pipeline,
      stage,
      contact,
      status,
      title,
      assignedTo,
      monetaryValue,
    } = propsValue;

    return await createOpportunity(auth, {
      pipelineStageId: stage,
      contactId: contact,
      status: status,
      name: title,
      pipelineId: pipeline,
      assignedTo: assignedTo,
      monetaryValue: monetaryValue,
    });
  },
});

type LeadConnectorStage = {
  id: string;
  name: string;
};
