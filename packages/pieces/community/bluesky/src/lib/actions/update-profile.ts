import { createAction, Property } from '@activepieces/pieces-framework';
import type { AtpAgent, BlobRef } from '@atproto/api';
import { blueskyAuth } from '../common/auth';
import { updateProfileOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyCompose } from '../common/compose';

const MAX_DISPLAY_NAME = 64;
const MAX_DESCRIPTION = 256;
const PROFILE_COLLECTION = 'app.bsky.actor.profile';

export const updateProfile = createAction({
  auth: blueskyAuth,
  name: 'update_profile',
  classification: 'WRITE',
  displayName: 'Update Profile',
  description: 'Change your display name, bio or avatar',
  audience: 'both',
  outputSchema: updateProfileOutputSchema,
  aiMetadata: {
    description:
      'Updates the connected Bluesky account\'s own profile: display name (max 64 characters), bio (max 256) and avatar image URL. Fields left empty keep their current value, every other profile field (banner, pinned post, existing avatar) is kept as it is, and the Clear options blank a field. Idempotent: the same input leaves the profile in the same state.',
    idempotent: true,
  },
  props: {
    displayName: Property.ShortText({ displayName: 'Display Name', description: 'New display name. Leave empty to keep the current one.', required: false }),
    clearDisplayName: Property.Checkbox({ displayName: 'Clear Display Name', description: 'Remove the display name.', required: false, defaultValue: false }),
    description: Property.LongText({ displayName: 'Bio', description: 'New bio. Leave empty to keep the current one.', required: false }),
    clearDescription: Property.Checkbox({ displayName: 'Clear Bio', description: 'Remove the bio.', required: false, defaultValue: false }),
    avatarUrl: Property.ShortText({ displayName: 'Avatar Image URL', description: 'PNG or JPEG, max 1 MB. Leave empty to keep the current avatar.', required: false }),
  },
  async run({ auth, propsValue }) {
    const displayName = textChange({ value: propsValue.displayName, clear: propsValue.clearDisplayName, max: MAX_DISPLAY_NAME, label: 'Display Name' });
    const description = textChange({ value: propsValue.description, clear: propsValue.clearDescription, max: MAX_DESCRIPTION, label: 'Bio' });
    const avatarUrl = propsValue.avatarUrl?.trim() ? propsValue.avatarUrl.trim() : undefined;
    if (displayName.kind === 'keep' && description.kind === 'keep' && avatarUrl === undefined) {
      throw new Error('Nothing to update. Fill in at least one field or tick a Clear option.');
    }
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'update the profile',
      fn: async (agent) => {
        const did = blueskyClient.sessionDid(agent);
        const avatar = avatarUrl ? await uploadAvatar({ agent, url: avatarUrl }) : undefined;
        const existing = await currentProfile({ agent, did });
        const next = applyChanges({ existing: existing?.value ?? {}, displayName, description, avatar });
        await agent.com.atproto.repo.putRecord({
          repo: did,
          collection: PROFILE_COLLECTION,
          rkey: 'self',
          record: next,
          swapRecord: existing?.cid ?? null,
        });
        return {
          did,
          displayName: typeof next['displayName'] === 'string' ? next['displayName'] : '',
          description: typeof next['description'] === 'string' ? next['description'] : '',
          avatarUpdated: avatar !== undefined,
          updatedAt: new Date().toISOString(),
        };
      },
    });
  },
});

async function currentProfile({ agent, did }: { agent: AtpAgent; did: string }): Promise<{ value: Record<string, unknown>; cid: string | null } | undefined> {
  try {
    const response = await agent.com.atproto.repo.getRecord({ repo: did, collection: PROFILE_COLLECTION, rkey: 'self' });
    return { value: { ...response.data.value }, cid: response.data.cid ?? null };
  } catch (error) {
    if (blueskyClient.isXrpcError(error) && (error.error === 'RecordNotFound' || /could not locate record/i.test(error.message))) {
      return undefined;
    }
    throw error;
  }
}

function textChange({ value, clear, max, label }: { value: string | undefined; clear: boolean | undefined; max: number; label: string }): TextChange {
  if (clear === true) {
    return { kind: 'clear' };
  }
  if (value === undefined || value.trim() === '') {
    return { kind: 'keep' };
  }
  const length = blueskyCompose.graphemeLength(value);
  if (length > max) {
    throw new Error(`${label} is ${length} characters long; Bluesky allows at most ${max}.`);
  }
  return { kind: 'set', value };
}

function applyChanges({
  existing,
  displayName,
  description,
  avatar,
}: {
  existing: Record<string, unknown>;
  displayName: TextChange;
  description: TextChange;
  avatar: BlobRef | undefined;
}): Record<string, unknown> {
  const { displayName: currentName, description: currentDescription, ...rest } = existing;
  return {
    ...rest,
    $type: PROFILE_COLLECTION,
    ...(displayName.kind === 'set' ? { displayName: displayName.value } : displayName.kind === 'keep' && currentName !== undefined ? { displayName: currentName } : {}),
    ...(description.kind === 'set' ? { description: description.value } : description.kind === 'keep' && currentDescription !== undefined ? { description: currentDescription } : {}),
    ...(avatar ? { avatar } : {}),
  };
}

async function uploadAvatar({ agent, url }: { agent: AtpAgent; url: string }): Promise<BlobRef | undefined> {
  const embed = await blueskyCompose.uploadImages({ agent, images: [{ url, alt: '' }] });
  return embed?.images[0]?.image;
}

type TextChange = { kind: 'keep' } | { kind: 'clear' } | { kind: 'set'; value: string };
