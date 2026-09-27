import { HttpMethod } from '@activepieces/pieces-common';
import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { kleapAuth } from '../auth';
import { JsonObject, kleapRequest, resolveAppId, toList } from '../common/client';
import { appDropdown } from '../common/props';

const MAX_FILE_BYTES = 512 * 1024;

const pathsProp = (description: string) =>
  Property.LongText({
    displayName: 'Paths',
    description,
    required: true,
  });

export const listFiles = createAction({
  auth: kleapAuth,
  name: 'list_files',
  displayName: 'List Files',
  description: 'Lists every file of the app (path, type, updated_at). Astro sites: src/pages/*.astro, src/data/*.json, public/*…',
  props: { app_id: appDropdown() },
  async run(context) {
    const appId = await resolveAppId(context.auth, context.propsValue.app_id);
    return kleapRequest(context.auth, HttpMethod.GET, `/apps/${appId}/files`);
  },
});

export const readFiles = createAction({
  auth: kleapAuth,
  name: 'read_files',
  displayName: 'Read Files',
  description: 'Returns the current content of up to 60 files. Missing paths are listed in "missing".',
  props: {
    app_id: appDropdown(),
    paths: pathsProp('One path per line or comma-separated, e.g. src/pages/index.astro'),
  },
  async run(context) {
    const appId = await resolveAppId(context.auth, context.propsValue.app_id);
    const paths = toList(context.propsValue.paths);
    if (!paths.length) throw new Error('Give at least one path.');
    if (paths.length > 60) throw new Error(`At most 60 files per call (got ${paths.length}).`);
    return kleapRequest(context.auth, HttpMethod.GET, `/apps/${appId}/files`, { query: { paths: paths.join(',') } });
  },
});

export const writeFile = createAction({
  auth: kleapAuth,
  name: 'write_file',
  displayName: 'Write File',
  description:
    'Creates or replaces a file with exact content (text, or a binary such as an image, logo or font). 512 KB max. Publish the app afterwards to put it live.',
  props: {
    app_id: appDropdown(),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'e.g. src/pages/about.astro or public/logo.png',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Text Content',
      description: 'The full file content. Leave empty when you upload a file below.',
      required: false,
    }),
    file: Property.File({
      displayName: 'File (Binary)',
      description: 'An image, PDF, font… from a previous step or a URL. Sent base64-encoded. Takes precedence over Text Content.',
      required: false,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const appId = await resolveAppId(context.auth, p.app_id);
    const path = p.path.trim();
    let file: JsonObject;
    const upload = p.file as ApFile | undefined;
    if (upload && upload.data) {
      const buffer = Buffer.isBuffer(upload.data) ? upload.data : Buffer.from(upload.data);
      if (buffer.length > MAX_FILE_BYTES) {
        throw new Error(`The file is ${Math.round(buffer.length / 1024)} KB; Kleap accepts 512 KB per file at most.`);
      }
      file = { path, content: buffer.toString('base64'), encoding: 'base64' };
    } else if (typeof p.content === 'string') {
      file = { path, content: p.content };
    } else {
      throw new Error('Provide either Text Content or a File.');
    }
    return kleapRequest(context.auth, HttpMethod.PUT, `/apps/${appId}/files`, { body: { files: [file] } });
  },
});

export const editFile = createAction({
  auth: kleapAuth,
  name: 'edit_file',
  displayName: 'Edit File',
  description:
    'Replaces a snippet inside an existing file (find & replace) without resending the whole file. Read the file first to copy the exact text.',
  props: {
    app_id: appDropdown(),
    path: Property.ShortText({ displayName: 'Path', required: true }),
    old_string: Property.LongText({
      displayName: 'Find',
      description: 'Exact text to replace. Must be unique in the file unless "Replace All" is on.',
      required: true,
    }),
    new_string: Property.LongText({
      displayName: 'Replace With',
      description: 'Leave empty to remove the found text.',
      required: false,
    }),
    replace_all: Property.Checkbox({ displayName: 'Replace All', required: false, defaultValue: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const appId = await resolveAppId(context.auth, p.app_id);
    return kleapRequest(context.auth, HttpMethod.PATCH, `/apps/${appId}/files`, {
      body: {
        edits: [
          { path: p.path.trim(), old_string: p.old_string, new_string: p.new_string ?? '', replace_all: !!p.replace_all },
        ],
      },
    });
  },
});

export const deleteFiles = createAction({
  auth: kleapAuth,
  name: 'delete_files',
  displayName: 'Delete Files',
  description: 'Removes pages or assets from the app (never blank a file to "delete" it). Publish afterwards.',
  props: {
    app_id: appDropdown(),
    paths: pathsProp('One path per line or comma-separated.'),
  },
  async run(context) {
    const appId = await resolveAppId(context.auth, context.propsValue.app_id);
    const paths = toList(context.propsValue.paths);
    if (!paths.length) throw new Error('Give at least one path.');
    return kleapRequest(context.auth, HttpMethod.DELETE, `/apps/${appId}/files`, { body: { paths } });
  },
});
