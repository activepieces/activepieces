import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { uploadedFileOutputSchema } from '../output-schemas';

export const dropboxCreateNewTextFile = createAction({
  auth: dropboxAuth,
  name: 'create_new_dropbox_text_file',
  classification: 'WRITE',
  description: 'Create a text file from the text you enter',
  audience: 'both',
  aiMetadata: { description: 'Writes the provided text content to a new file at the given Dropbox path (upload in add mode). Use when an agent needs to persist generated or supplied text directly as a file without first producing a file object. Not idempotent: each call uploads, so repeating it can create autorenamed duplicates rather than overwriting.', idempotent: false },
  displayName: 'Create New Text File',
  outputSchema: uploadedFileOutputSchema,
  propertyGroups: [
    { key: 'destination', display: 'section', label: 'Destination', icon: 'file', props: ['path'] },
    { key: 'content', display: 'section', label: 'Content', icon: 'text', props: ['text'] },
  ],
  props: {
    path: Property.ShortText({
      displayName: 'Path',
      description: 'Path of the new file, including its name.',
      placeholder: '/Notes/meeting.txt',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'Saved as plain UTF-8 text.',
      placeholder: 'Meeting notes...',
      required: true,
    }),
    autorename: Property.Checkbox({
      displayName: 'Auto Rename',
      description: 'If the name is taken, save under a new name instead of failing.',
      required: false,
      advanced: true,
    }),
    mute: Property.Checkbox({
      displayName: 'Mute Notifications',
      description: "Don't notify the account's Dropbox apps about this change.",
      required: false,
      advanced: true,
    }),
    strict_conflict: Property.Checkbox({
      displayName: 'Strict Conflict',
      description: 'Fail even when a file with identical contents is already there.',
      required: false,
      advanced: true,
    }),
  },
  async run(context) {
    const params = {
      autorename: context.propsValue.autorename,
      path: context.propsValue.path,
      mode: 'add',
      mute: context.propsValue.mute,
      strict_conflict: context.propsValue.strict_conflict,
    };

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://content.dropboxapi.com/2/files/upload`,
      body: Buffer.from(context.propsValue.text, 'utf-8'),
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      headers: {
        'Dropbox-API-Arg': dropboxCommon.encodeApiArg(params),
        'Content-Type': 'application/octet-stream',
      },
    };

    const result = await httpClient.sendRequest(request);

    return result.body;
  },
});
