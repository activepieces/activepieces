import { Property } from '@activepieces/pieces-framework';

export const pastefyAiProps = { pasteId, folderId };

function pasteId() {
  return Property.ShortText({
    displayName: 'Paste ID',
    description: 'The 8-character paste ID, as in https://pastefy.app/<id>. Get it from List My Pastes or Search Public Pastes.',
    required: true,
  });
}

function folderId({ required, displayName, description }: { required: boolean; displayName: string; description: string }) {
  return Property.ShortText({ displayName, description, required });
}
