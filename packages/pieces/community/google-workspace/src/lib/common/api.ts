import { HttpMethod } from '@activepieces/pieces-common';

import { googleWorkspaceClient } from './client';
import { googleWorkspaceUtils } from './utils';

import type { GoogleWorkspaceResolvedAuth, GoogleWorkspaceResourceDefinition } from './types';

async function resolveIdentifier({
  def,
  auth,
  id,
}: {
  def: GoogleWorkspaceResourceDefinition;
  auth: GoogleWorkspaceResolvedAuth;
  id: string;
}): Promise<string> {
  if (def.type === 'org_unit' && googleWorkspaceUtils.isRootOrgUnitPath(id)) {
    return await rootOrgUnitId(auth);
  }
  return id;
}

async function rootOrgUnitId(auth: GoogleWorkspaceResolvedAuth): Promise<string> {
  const response = await googleWorkspaceClient.request<{
    organizationUnits?: { orgUnitId?: unknown; orgUnitPath?: unknown }[];
  }>({
    auth,
    method: HttpMethod.GET,
    path: googleWorkspaceUtils.resources.org_unit.collectionPath(),
    query: { type: 'allIncludingParent' },
  });
  const units = response.organizationUnits;
  const rootId = (Array.isArray(units) ? units : []).find(
    (unit) => typeof unit === 'object' && unit !== null && unit.orgUnitPath === '/',
  )?.orgUnitId;
  if (typeof rootId !== 'string' || rootId === '') {
    throw new Error(
      'Could not read the ID of the root organizational unit (/) from Google. Use its ID (id:...) instead of /.',
    );
  }
  return rootId;
}

export const googleWorkspaceApi = { resolveIdentifier };
