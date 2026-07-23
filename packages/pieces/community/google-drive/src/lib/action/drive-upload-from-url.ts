import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import FormData from 'form-data';
import { googleDriveAuth, getAccessToken } from '../auth';
import mime from 'mime-types';

export const driveUploadFromUrl = createAction({
  auth: googleDriveAuth,
  name: 'drive_upload_from_url',
  displayName: 'Upload File from URL',
  description: 'Fetch a file from a public URL and upload it into Google Drive.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a file from a public URL and uploads it into Drive in one step (server-side fetch, no base64 round-trip). Use when the agent has a downloadable link rather than file bytes; for bytes already in hand use `drive_upload_file`, and for plain generated text use `drive_create_file_from_text`. Each call creates a new file.',
    idempotent: false,
  },
  props: {
    source_url: Property.ShortText({
      displayName: 'Source URL',
      description:
        'The publicly accessible URL to fetch the file from. Only public URLs are supported (no authentication headers are sent).',
      required: true,
    }),
    file_name: Property.ShortText({
      displayName: 'File name',
      description: 'The name to give the uploaded file in Drive.',
      required: true,
    }),
    mime_type: Property.ShortText({
      displayName: 'MIME Type',
      description:
        'Optional MIME type for the uploaded file (e.g. application/pdf). Provide this when the URL has no file extension; otherwise the type is inferred from the URL.',
      required: false,
    }),
    parent_folder_id: Property.ShortText({
      displayName: 'Parent Folder ID',
      description:
        'The ID of the folder to upload the file into. Leave empty to upload to the root of My Drive. Resolve a folder ID with `drive_search_files`.',
      required: false,
    }),
    include_team_drives: Property.Checkbox({
      displayName: 'Include Team Drives',
      description:
        'Determines if folders from Team Drives should be included in the results.',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const { source_url, file_name, mime_type, parent_folder_id } =
      context.propsValue;

    // SSRF: only public URLs supported — no auth headers are forwarded and the
    // caller is responsible for supplying a publicly reachable link.
    let download;
    try {
      download = await httpClient.sendRequest<ArrayBuffer>({
        method: HttpMethod.GET,
        url: source_url,
        responseType: 'arraybuffer',
      });
    } catch (error: any) {
      throw new Error(
        `Failed to fetch the file from the source URL (${source_url}). Ensure it is a publicly accessible link. Underlying error: ${
          error?.message ?? error
        }`
      );
    }

    // Honor an explicit mime_type when the URL lacks an extension; otherwise
    // infer it from the URL so Drive does not default everything to octet-stream.
    const resolvedMimeType =
      mime_type || mime.lookup(source_url) || 'application/octet-stream';

    const meta = {
      mimeType: resolvedMimeType,
      name: file_name,
      ...(parent_folder_id ? { parents: [parent_folder_id] } : {}),
    };

    const metaBuffer = Buffer.from(JSON.stringify(meta), 'utf-8');
    const fileBuffer = Buffer.from(download.body);

    const form = new FormData();
    form.append('Metadata', metaBuffer, { contentType: 'application/json' });
    form.append('Media', fileBuffer, { contentType: resolvedMimeType });

    const result = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://www.googleapis.com/upload/drive/v3/files`,
      queryParams: {
        uploadType: 'multipart',
        supportsAllDrives: String(
          context.propsValue.include_team_drives || false
        ),
      },
      body: form,
      headers: {
        ...form.getHeaders(),
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: await getAccessToken(context.auth),
      },
    });

    return result.body;
  },
});
