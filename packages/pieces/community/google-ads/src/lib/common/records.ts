import { Property } from '@activepieces/pieces-framework';

import { GoogleAdsApi, normalizeCustomerId } from './client';
import type { GoogleAdsAuthValue } from './client';
import { buildOperation, idFromResourceName, recordByResourceNameQuery, resourceDefinition, resourceTypeOptions } from './resources';
import type { RecordOperation, ResourceDefinition } from './resources';

export async function mutateRecord({ auth, customerId, def, operation, validateOnly }: MutateRecordParams): Promise<RecordMutationResult> {
  const normalizedCustomerId = normalizeCustomerId(customerId);
  const response = await GoogleAdsApi.mutate({
    auth,
    customerId: normalizedCustomerId,
    operations: [buildOperation({ def, operation })],
    options: { validateOnly },
  });

  const result = response.mutateOperationResponses?.[0]?.[def.resultKey];
  const resourceName = result?.resourceName ?? null;
  const rest = Object.fromEntries(Object.entries(result ?? {}).filter(([key]) => key !== 'resourceName'));
  const returned = Object.keys(rest).length > 0 ? rest : null;

  const record =
    returned === null && resourceName && !validateOnly && !('remove' in operation)
      ? await readRecord({ auth, customerId: normalizedCustomerId, def, resourceName })
      : returned;

  return {
    resourceType: def.type,
    resourceName,
    id: idFromResourceName(resourceName ?? undefined),
    record,
    validateOnly,
  };
}

async function readRecord({ auth, customerId, def, resourceName }: ReadRecordParams): Promise<Record<string, unknown> | null> {
  try {
    const page = await GoogleAdsApi.search({ auth, customerId, query: recordByResourceNameQuery({ def, resourceName }) });
    return page.results?.[0] ?? null;
  } catch {
    return null;
  }
}

export const resourceTypeProp = Property.StaticDropdown<string, true>({
  displayName: 'Resource Type',
  description: 'Which kind of record: campaign, ad group, ad, keyword or audience list.',
  required: true,
  options: { options: resourceTypeOptions },
});

export const validateOnlyProp = Property.Checkbox({
  displayName: 'Validate Only',
  description: 'Ask Google to validate the request without applying it. Nothing is created, changed or removed.',
  required: false,
  defaultValue: false,
});

export const recordIdentifierProp = Property.ShortText({
  displayName: 'Record ID or Resource Name',
  description:
    'Numeric id for campaigns, ad groups and audience lists; `<adGroupId>~<adId>` for ads; `<adGroupId>~<criterionId>` for keywords. A full resource name (`customers/…/campaigns/…`) also works.',
  required: true,
});

export { resourceDefinition };

export type RecordMutationResult = {
  resourceType: string;
  resourceName: string | null;
  id: string | null;
  record: Record<string, unknown> | null;
  validateOnly: boolean;
};

export type MutateRecordParams = {
  auth: GoogleAdsAuthValue;
  customerId: string;
  def: ResourceDefinition;
  operation: RecordOperation;
  validateOnly: boolean;
};

type ReadRecordParams = {
  auth: GoogleAdsAuthValue;
  customerId: string;
  def: ResourceDefinition;
  resourceName: string;
};
