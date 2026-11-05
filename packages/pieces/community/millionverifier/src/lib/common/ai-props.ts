import { Property } from '@activepieces/pieces-framework';

function fileId<R extends boolean>({ required, displayName = 'File ID', description = 'ID of a bulk file, e.g. "32502003". Upload Emails for Bulk Verification and List Bulk Files return it as file_id.' }: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

export const millionVerifierAiProps = { fileId };

type PropParams<R extends boolean> = { required: R; displayName?: string; description?: string };
