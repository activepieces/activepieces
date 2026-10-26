import { Property } from '@activepieces/pieces-framework';
import type { DropdownState } from '@activepieces/pieces-framework';

import { googleWorkspaceAuth } from '../auth';
import { googleWorkspaceClient } from './client';
import { googleWorkspaceUtils } from './utils';

import type {
  GoogleWorkspaceAuthValue,
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
  displayName = 'Record (JSON)',
  description = `Fields in the Directory API shape of the resource type (camelCase). Examples: ${createExamples()}`,
}: PropParams<R>) {
  return Property.Json({ displayName, description, required });
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

export const googleWorkspaceProps = { resourceType, identifier, parent, record, applicationId };

export type PropParams<R extends boolean> = {
  required: R;
  displayName?: string;
  description?: string;
};
