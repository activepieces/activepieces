import { HttpMethod } from '@activepieces/pieces-common';
import { CognitoFormsApiError, cognitoRequest } from './client';
import { entryPath } from './entries';

export async function deleteEntry({
  apiKey,
  formId,
  entryId,
}: {
  apiKey: string;
  formId: string;
  entryId: string;
}): Promise<DeleteEntryResult> {
  const path = entryPath({ formId: formId, entryId: entryId });
  try {
    await cognitoRequest<unknown>({ apiKey, method: HttpMethod.DELETE, path });
    return { deleted: true, already_deleted: false, form_id: formId, entry_id: entryId };
  } catch (error) {
    if (error instanceof CognitoFormsApiError && error.status === 404 && error.errorType === 'EntryNotFound') {
      return { deleted: true, already_deleted: true, form_id: formId, entry_id: entryId };
    }
    throw error;
  }
}

export type DeleteEntryResult = {
  deleted: boolean;
  already_deleted: boolean;
  form_id: string;
  entry_id: string;
};
