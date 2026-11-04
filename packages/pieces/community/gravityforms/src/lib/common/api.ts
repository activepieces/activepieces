import { HttpMethod } from '@activepieces/pieces-common';
import { gravityFormsClient } from './client';
import type { GravityFormsAuthValue, GravityFormsEntry, GravityFormsForm, GravityFormsFormSummary } from './types';

async function listForms({ auth }: { auth: GravityFormsAuthValue }): Promise<Record<string, GravityFormsFormSummary>> {
  return await gravityFormsClient.request<Record<string, GravityFormsFormSummary>>({
    auth,
    method: HttpMethod.GET,
    path: '/forms',
  });
}

async function getForm({ auth, formId }: { auth: GravityFormsAuthValue; formId: string }): Promise<GravityFormsForm> {
  return await gravityFormsClient.request<GravityFormsForm>({
    auth,
    method: HttpMethod.GET,
    path: `/forms/${encodeURIComponent(formId)}`,
  });
}

async function getEntry({ auth, entryId }: { auth: GravityFormsAuthValue; entryId: string }): Promise<GravityFormsEntry> {
  return await gravityFormsClient.request<GravityFormsEntry>({
    auth,
    method: HttpMethod.GET,
    path: `/entries/${encodeURIComponent(entryId)}`,
  });
}

export const gravityFormsApi = { listForms, getForm, getEntry };
