import {
  createAction,
  InputPropertyMap,
  isNil,
  Property,
  tryCatch,
} from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { pipelineDropdown } from '../common/dropdowns';
import { outsetaErrors } from '../common/errors';
import { outsetaMappers } from '../common/mappers';
import { OutsetaDeal } from '../common/outseta-types';

export const getDealAction = createAction({
  name: 'get_deal',
  auth: outsetaAuth,
  displayName: 'Retrieve Deal',
  description:
    'Retrieve a deal by its UID, or by the email of an associated contact within a pipeline. Returns found=false when nothing matches.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches a single Outseta CRM deal by its UID, or by a contact email within a chosen pipeline, returning amount, due date, pipeline and stage, the associated account, contact emails and custom properties. Pick the lookup mode first, then fill the fields it reveals. Returns found=false instead of failing. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    lookupBy: Property.StaticDropdown({
      displayName: 'Find deal by',
      required: true,
      defaultValue: 'uid',
      display: 'cards',
      options: {
        disabled: false,
        options: [
          {
            label: 'Deal UID',
            value: 'uid',
            description: 'You already have the identifier',
            icon: 'tag',
          },
          {
            label: 'Contact + pipeline',
            value: 'contact',
            description: 'Search a pipeline by contact email',
            icon: 'users',
          },
        ],
      },
    }),
    lookup: Property.DynamicProperties({
      displayName: 'Deal',
      required: true,
      auth: outsetaAuth,
      refreshers: ['lookupBy'],
      props: async (propsValue): Promise<InputPropertyMap> => {
        if (asText(propsValue['lookupBy']) === 'contact') {
          return {
            contactEmail: Property.ShortText({
              displayName: 'Contact email',
              description: 'An email attached to the deal.',
              required: true,
              placeholder: 'jane@example.com',
            }),
            pipelineUid: pipelineDropdown({ required: true }),
          };
        }
        return {
          dealUid: Property.ShortText({
            displayName: 'Deal UID',
            required: true,
            placeholder: 'dQGeJZDW',
          }),
        };
      },
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const lookup = context.propsValue.lookup ?? {};

    const deal =
      context.propsValue.lookupBy === 'contact'
        ? await dealByContact({
            client,
            contactEmail: requireText({
              value: asText(lookup['contactEmail']),
              label: 'Contact email',
            }),
            pipelineUid: requireText({
              value: asText(lookup['pipelineUid']),
              label: 'Pipeline',
            }),
          })
        : await dealByUid({
            client,
            uid: requireText({
              value: asText(lookup['dealUid']),
              label: 'Deal UID',
            }),
          });

    if (isNil(deal)) {
      return { found: false, ...outsetaMappers.deal({}) };
    }

    return { found: true, ...outsetaMappers.deal(deal) };
  },
});

function asText(value: unknown): string | undefined {
  return typeof value === 'string' && value !== '' ? value : undefined;
}

function requireText({
  value,
  label,
}: {
  value: string | undefined;
  label: string;
}): string {
  if (isNil(value)) {
    throw new Error(`${label} is required for the selected lookup mode.`);
  }
  return value;
}

async function dealByUid({
  client,
  uid,
}: {
  client: OutsetaClient;
  uid: string;
}): Promise<OutsetaDeal | null> {
  const { data, error } = await tryCatch(() =>
    client.get<OutsetaDeal>(`/api/v1/crm/deals/${uid}?${DEAL_FIELDS}`)
  );

  if (error) {
    if (outsetaErrors.isNotFound(error)) {
      return null;
    }
    throw error;
  }

  return data;
}

async function dealByContact({
  client,
  contactEmail,
  pipelineUid,
}: {
  client: OutsetaClient;
  contactEmail: string;
  pipelineUid: string;
}): Promise<OutsetaDeal | null> {
  const deals = await client.getAllPages<OutsetaDeal>(
    `/api/v1/crm/deals?DealPipelineStage.DealPipeline.Uid=${encodeURIComponent(
      pipelineUid
    )}&${DEAL_FIELDS}`
  );

  const wanted = contactEmail.toLowerCase();

  return (
    deals.find((deal) =>
      outsetaMappers
        .toArray(deal.DealPeople)
        .some((link) => link.Person?.Email?.toLowerCase() === wanted)
    ) ?? null
  );
}

const DEAL_FIELDS =
  'fields=*,DealPipelineStage.Uid,DealPipelineStage.Name,DealPipelineStage.DealPipeline.Uid,DealPipelineStage.DealPipeline.Name,DealPeople.Person.Uid,DealPeople.Person.Email,Account.Uid,Account.Name';
