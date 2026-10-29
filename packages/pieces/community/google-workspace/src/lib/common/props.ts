import { HttpMethod } from '@activepieces/pieces-common';
import { Property, tryCatch } from '@activepieces/pieces-framework';
import type { DropdownState, DynamicPropsValue } from '@activepieces/pieces-framework';

import { googleWorkspaceAuth } from '../auth';
import { googleWorkspaceClient } from './client';
import { googleWorkspaceUtils } from './utils';

import type {
  GoogleWorkspaceAuthValue,
  GoogleWorkspaceCustomSchema,
  GoogleWorkspaceRecordField,
  GoogleWorkspaceRecordMode,
  GoogleWorkspaceTransferApplication,
  GoogleWorkspaceVerb,
} from './types';

function resourceType({ verb }: { verb: GoogleWorkspaceVerb }) {
  return Property.StaticDropdown<string, true>({
    displayName: 'Resource Type',
    description: 'Which kind of record. Only the types this action supports are listed.',
    required: true,
    options: {
      options: googleWorkspaceUtils.resourceTypeOptions.filter((option) =>
        googleWorkspaceUtils.resources[option.value].verbs.includes(verb),
      ),
    },
  });
}

function identifier<R extends boolean>({
  required,
  displayName = 'Record Identifier',
  description = Object.values(googleWorkspaceUtils.resources)
    .map((def) => `**${def.label}**: ${def.idHint}`)
    .join(' · '),
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function parent<R extends boolean>({
  required,
  displayName = 'Parent Record',
  description = Object.values(googleWorkspaceUtils.resources)
    .filter((def) => def.parentLabel)
    .map((def) => `Only for **${def.label}**: the ${def.parentLabel}.`)
    .join(' '),
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function record<R extends boolean>({
  required,
  displayName = 'Extra Fields (JSON)',
  description = `Optional. Any other field in the Directory API shape of the resource type (camelCase); the Fields above win on conflicts. Examples: ${createExamples()}`,
}: PropParams<R>) {
  return Property.Json({ displayName, description, required });
}

function recordFields<R extends boolean>({
  required,
  mode,
  displayName = 'Fields',
  description = mode === 'create'
    ? 'The fields of the new record. They change with the Resource Type.'
    : 'Only the fields you fill in are changed; empty fields keep their current value.',
}: PropParams<R> & { mode: GoogleWorkspaceRecordMode }) {
  return Property.DynamicProperties({
    auth: googleWorkspaceAuth,
    displayName,
    description,
    required,
    refreshers: ['resourceType'],
    props: async ({ auth, resourceType }): Promise<DynamicPropsValue> => {
      if (typeof resourceType !== 'string' || !googleWorkspaceUtils.isResourceType(resourceType)) {
        return {};
      }
      const def = googleWorkspaceUtils.resources[resourceType];
      const standard = (def.fields ?? []).map((field) => [field.key, fieldInput({ field, mode })]);
      const custom = resourceType === 'user' && auth ? await customUserFieldInputs(auth) : [];
      return Object.fromEntries([...standard, ...custom]);
    },
  });
}

function fieldInput({
  field,
  mode,
}: {
  field: GoogleWorkspaceRecordField;
  mode: GoogleWorkspaceRecordMode;
}) {
  const base = {
    displayName: field.displayName,
    description: field.description,
    required: mode === 'create' && field.requiredOnCreate === true,
  };
  if (field.kind === 'checkbox') {
    return Property.Checkbox(base);
  }
  if (field.kind === 'dropdown') {
    return Property.StaticDropdown({
      ...base,
      options: {
        options: (field.options ?? []).map((option) => ({ label: option, value: option })),
      },
    });
  }
  return Property.ShortText(base);
}

async function customUserFieldInputs(
  auth: GoogleWorkspaceAuthValue,
): Promise<[string, DynamicPropsValue[string]][]> {
  const { data: response } = await tryCatch(async () =>
    googleWorkspaceClient.request<{ schemas?: GoogleWorkspaceCustomSchema[] }>({
      auth: await googleWorkspaceClient.resolveAuth(auth),
      method: HttpMethod.GET,
      path: `${googleWorkspaceUtils.directoryPath}/customer/${googleWorkspaceUtils.myCustomer}/schemas`,
    }),
  );
  return (response?.schemas ?? []).flatMap((schema) =>
    (schema.fields ?? []).map((field): [string, DynamicPropsValue[string]] => [
      googleWorkspaceUtils.customFieldKey({
        schemaName: schema.schemaName,
        fieldName: field.fieldName,
      }),
      customFieldInput({ schema, field }),
    ]),
  );
}

function customFieldInput({
  schema,
  field,
}: {
  schema: GoogleWorkspaceCustomSchema;
  field: NonNullable<GoogleWorkspaceCustomSchema['fields']>[number];
}) {
  const displayName = `${schema.displayName ?? schema.schemaName}: ${
    field.displayName ?? field.fieldName
  }`;
  const description = `Custom field (${field.fieldType ?? 'STRING'}).${
    field.multiValued ? ' Several values: add one item each.' : ''
  }`;
  if (field.multiValued) {
    return Property.Array({ displayName, description, required: false });
  }
  if (field.fieldType === 'BOOL') {
    return Property.Checkbox({ displayName, description, required: false });
  }
  if (field.fieldType === 'INT64' || field.fieldType === 'DOUBLE') {
    return Property.Number({ displayName, description, required: false });
  }
  return Property.ShortText({ displayName, description, required: false });
}

function applicationId<R extends boolean>({
  required,
  displayName = 'Application',
  description = "Which application's data to transfer. The label lists the parameters the application accepts.",
}: PropParams<R>) {
  return Property.Dropdown<string, R, typeof googleWorkspaceAuth>({
    displayName,
    description,
    required,
    auth: googleWorkspaceAuth,
    refreshers: [],
    options: async ({ auth }) => await applicationOptions(auth),
  });
}

async function applicationOptions(
  auth: GoogleWorkspaceAuthValue | undefined,
): Promise<DropdownState<string>> {
  if (!auth) {
    return disabledOptions({
      placeholder: 'Please select an existing or create a new connection.',
    });
  }
  try {
    const { items: applications } =
      await googleWorkspaceClient.listAll<GoogleWorkspaceTransferApplication>({
        auth: await googleWorkspaceClient.resolveAuth(auth),
        path: `${googleWorkspaceUtils.dataTransferPath}/applications`,
        itemsKey: 'applications',
        query: { customerId: googleWorkspaceUtils.myCustomer, maxResults: 100 },
        maxRows: 500,
      });
    if (applications.length === 0) {
      return disabledOptions({
        placeholder: 'No application supports data transfer in this account.',
      });
    }
    return {
      disabled: false,
      options: applications.map((app) => ({ label: labelFor(app), value: String(app.id) })),
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return disabledOptions({
      placeholder: `An error occurred while listing the transferable applications: ${detail.slice(
        0,
        300,
      )}`,
    });
  }
}

function labelFor(app: GoogleWorkspaceTransferApplication): string {
  const params = (app.transferParams ?? []).map((p) => `${p.key}: ${p.value.join('|')}`).join(', ');
  return params ? `${app.name} (${params})` : app.name;
}

function createExamples(): string {
  return Object.values(googleWorkspaceUtils.resources)
    .filter((def) => def.createExample)
    .map((def) => `**${def.label}**: \`${JSON.stringify(def.createExample)}\``)
    .join(' · ');
}

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
  return { disabled: true, options: [], placeholder };
}

export const googleWorkspaceProps = {
  resourceType,
  identifier,
  parent,
  record,
  recordFields,
  applicationId,
};

export type PropParams<R extends boolean> = {
  required: R;
  displayName?: string;
  description?: string;
};
