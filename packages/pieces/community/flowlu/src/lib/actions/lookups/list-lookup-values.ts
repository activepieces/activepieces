import { createAction, Property } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import { FlowluApiError } from '../../common/client';
import { flowluInput } from '../../common/utils';
import { lookupOutputSchema } from '../../output-schemas';

const LOOKUPS: Record<
  string,
  { label: string; module: string; entity: string; parentField?: string }
> = {
  pipelines: { label: 'Sales pipelines', module: 'crm', entity: 'pipeline' },
  pipeline_stages: {
    label: 'Pipeline stages',
    module: 'crm',
    entity: 'pipeline_stage',
    parentField: 'pipeline_id',
  },
  opportunity_sources: {
    label: 'Opportunity sources',
    module: 'crm',
    entity: 'source',
  },
  loss_reasons: { label: 'Loss reasons', module: 'crm', entity: 'loss_reason' },
  account_categories: {
    label: 'Account categories',
    module: 'crm',
    entity: 'account_category',
  },
  industries: { label: 'Industries', module: 'crm', entity: 'industry' },
  honorific_titles: {
    label: 'Honorific titles',
    module: 'crm',
    entity: 'honorific_title',
  },
  task_workflows: {
    label: 'Task workflows',
    module: 'task',
    entity: 'workflows',
  },
  task_statuses: {
    label: 'Task workflow statuses',
    module: 'task',
    entity: 'stages',
    parentField: 'workflow_id',
  },
  project_templates: {
    label: 'Project templates',
    module: 'st',
    entity: 'project_types',
  },
  project_portfolios: {
    label: 'Project portfolios',
    module: 'st',
    entity: 'portfolio',
  },
};

export const listLookupValuesAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_list_lookup_values',
  classification: 'SEARCH',
  displayName: 'List Reference Values',
  description:
    'Lists pipelines, stages, sources, categories, workflows and other reference values with their IDs.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the IDs and names of one kind of Flowlu reference value: sales pipelines, pipeline stages (pass parent_id = pipeline ID), opportunity sources, loss reasons, account categories, industries, honorific titles, task workflows, task statuses (parent_id = workflow ID), project templates or project portfolios. Use to turn a name into the ID that create/update actions need. Returns up to 1000 values with has_more. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    entity: Property.StaticDropdown({
      displayName: 'Values',
      description: 'Which kind of reference value to list.',
      required: true,
      options: {
        disabled: false,
        options: Object.entries(LOOKUPS).map(([value, lookup]) => ({
          label: lookup.label,
          value,
        })),
      },
    }),
    parent_id: Property.ShortText({
      displayName: 'Parent ID',
      description:
        'For pipeline_stages: the pipeline ID. For task_statuses: the workflow ID. Leave empty to list all.',
      required: false,
    }),
  },
  outputSchema: lookupOutputSchema,
  async run(context) {
    const key = context.propsValue.entity;
    const lookup = typeof key === 'string' ? LOOKUPS[key] : undefined;
    if (lookup === undefined) {
      throw new FlowluApiError({
        message: `Unknown reference value type ${JSON.stringify(key)}.`,
      });
    }
    const parentId = flowluInput.optionalId({
      value: context.propsValue.parent_id,
      name: 'Parent ID',
    });
    if (parentId !== undefined && lookup.parentField === undefined) {
      throw new FlowluApiError({
        message: `${lookup.label} have no parent; leave Parent ID empty.`,
      });
    }
    const client = makeClient(context.auth);
    const pages = await fetchPages({
      fetchPage: (page) =>
        client.list<Record<string, unknown>>(lookup.module, lookup.entity, {
          ...(parentId !== undefined && lookup.parentField
            ? { [`filter[${lookup.parentField}]`]: parentId }
            : {}),
          'order_by[asc][]': 'id',
          page,
          limit: PAGE_SIZE,
        }),
    });
    const items = pages.items.map((item) => ({
      id: item['id'] ?? null,
      name: item['name'] ?? null,
      parent_id: lookup.parentField ? item[lookup.parentField] ?? null : null,
      active: item['active'] ?? item['is_active'] ?? null,
    }));
    return {
      entity: key,
      items,
      count: items.length,
      total: pages.total,
      has_more: pages.hasMore,
    };
  },
});

async function fetchPages({
  fetchPage,
}: {
  fetchPage: (page: number) => Promise<{
    items: Record<string, unknown>[];
    total_result?: number;
    total?: number;
  }>;
}): Promise<{
  items: Record<string, unknown>[];
  total: number;
  hasMore: boolean;
}> {
  const collected: Record<string, unknown>[][] = [];
  let total = 0;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const envelope = await fetchPage(page);
    collected.push(envelope.items);
    total = Number(envelope.total_result ?? envelope.total ?? 0);
    const seen = collected.reduce((sum, chunk) => sum + chunk.length, 0);
    if (envelope.items.length < PAGE_SIZE || seen >= total) {
      return {
        items: collected.flat(),
        total: Math.max(total, seen),
        hasMore: false,
      };
    }
  }
  const items = collected.flat();
  return { items, total, hasMore: items.length < total };
}

const PAGE_SIZE = 100;
const MAX_PAGES = 10;
