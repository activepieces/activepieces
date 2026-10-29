import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { matrixAuth } from '../../auth';
import { matrixClient } from '../../common/client';
import { matrixIds } from '../../common/ids';
import { matrixOutputSchemas } from '../../common/output-schemas';

export const createRoom = createAction({
  auth: matrixAuth,
  name: 'create_room',
  classification: 'WRITE',
  displayName: 'Create Room',
  description: 'Create a new room, optionally public, with invites.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates a new Matrix room owned by this account and returns its roomId (and alias when aliasName was given). preset private_chat (default, invite only), public_chat (anyone can join) or trusted_private_chat (invitees become admins). publishToDirectory lists it in the public room directory. invite takes user IDs (@user:server). aliasName is only the local part (e.g. "team-ops" makes #team-ops:yourserver) and fails if taken. Each call creates another room.',
    idempotent: false,
  },
  outputSchema: matrixOutputSchemas.createdRoom,
  props: {
    name: Property.ShortText({ displayName: 'Name', required: false }),
    topic: Property.LongText({ displayName: 'Topic', required: false }),
    preset: Property.StaticDropdown({
      displayName: 'Preset',
      required: false,
      defaultValue: 'private_chat',
      options: {
        options: [
          { label: 'Private (invite only)', value: 'private_chat' },
          { label: 'Public (anyone can join)', value: 'public_chat' },
          { label: 'Trusted private (invitees are admins)', value: 'trusted_private_chat' },
        ],
      },
    }),
    publishToDirectory: Property.Checkbox({ displayName: 'Publish to Room Directory', required: false, defaultValue: false }),
    aliasName: Property.ShortText({ displayName: 'Alias (local part)', description: 'e.g. team-ops for #team-ops:yourserver', required: false }),
    invite: Property.Array({ displayName: 'Invite User IDs', description: 'User IDs like @alice:example.org', required: false }),
  },
  async run({ auth, propsValue }) {
    const preset = propsValue.preset ?? 'private_chat';
    if (!['private_chat', 'public_chat', 'trusted_private_chat'].includes(preset)) {
      throw new Error('Preset must be private_chat, public_chat or trusted_private_chat.');
    }
    const aliasName = matrixClient.optionalText(propsValue.aliasName);
    if (aliasName !== undefined && !/^[a-z0-9._=/+-]+$/.test(aliasName)) {
      throw new Error('Alias must be only the local part, using lowercase letters, digits and . _ = - / +.');
    }
    const invite = matrixClient.stringList(propsValue.invite).map((user) => matrixIds.userId(user));
    const requestBody: Record<string, unknown> = {
      preset,
      visibility: propsValue.publishToDirectory === true ? 'public' : 'private',
    };
    const name = matrixClient.optionalText(propsValue.name);
    const topic = matrixClient.optionalText(propsValue.topic);
    if (name !== undefined) requestBody['name'] = name;
    if (topic !== undefined) requestBody['topic'] = topic;
    if (aliasName !== undefined) requestBody['room_alias_name'] = aliasName;
    if (invite.length > 0) requestBody['invite'] = invite;
    const body = await matrixClient.request({ auth: auth.props, method: HttpMethod.POST, path: matrixIds.clientPath('createRoom'), body: requestBody });
    const record = matrixClient.isRecord(body) ? body : {};
    const roomId = matrixClient.stringOr(record['room_id']);
    if (roomId === null) throw new Error('The homeserver did not return a room ID.');
    let alias = matrixClient.stringOr(record['room_alias']);
    if (alias === null && aliasName !== undefined) {
      try {
        const state = await matrixClient.request({
          auth: auth.props,
          method: HttpMethod.GET,
          path: matrixIds.clientPath('rooms', roomId, 'state', 'm.room.canonical_alias', ''),
        });
        alias = matrixClient.isRecord(state) ? matrixClient.stringOr(state['alias']) : null;
      } catch {
        alias = null;
      }
    }
    return { roomId, alias };
  },
});
