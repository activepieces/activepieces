import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { zohoCrmAuth } from '../../auth';
import {
  ZohoCrmError,
  ZohoListResponse,
  flattenWriteResult,
  optionalInt,
  requireApiName,
  requireId,
  stringList,
  unwrapWriteItem,
  zohoRequest,
  validatePaging,
} from '../../common/client';
import { flattenNote } from '../../common/flatten';
import { TAG_COLORS, changeTags, createNote, ensureTag, listTags, notDeletedError } from '../../common/records';
import {
  createTagOutputSchema,
  listNotesOutputSchema,
  listTagsOutputSchema,
  noteChangeOutputSchema,
  noteOutputSchema,
  noteWriteOutputSchema,
} from '../../output-schemas-ai';
import { tagChangeOutputSchema } from '../../output-schemas';

const NOTE_FIELDS = 'Note_Title,Note_Content,Parent_Id,Owner,Created_Time,Modified_Time';

const moduleApiName = Property.ShortText({
  displayName: 'Module API Name',
  description: 'Module API name from List Modules, e.g. "Leads" or "Deals".',
  required: true,
});

const noteId = Property.ShortText({ displayName: 'Note ID', description: 'Numeric note id from List Notes.', required: true });

export const listNotesAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_list_notes',
  classification: 'SEARCH',
  displayName: 'List Notes',
  description: 'Lists notes of a record, or all notes.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists notes attached to one Zoho CRM record (give parent_module and parent_id), or all notes in the org when both are empty (admin users only), one page of up to 200; page numbers reach the first 2,000 notes. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    parent_module: Property.ShortText({ displayName: 'Parent Module', description: 'Module API name of the record, e.g. "Leads". Give with parent_id.', required: false }),
    parent_id: Property.ShortText({ displayName: 'Parent Record ID', required: false }),
    page: Property.Number({ displayName: 'Page', required: false }),
    per_page: Property.Number({ displayName: 'Per Page', description: '1 to 200 (default 50).', required: false }),
  },
  outputSchema: listNotesOutputSchema,
  async run({ auth, propsValue: p }) {
    if (!p.parent_module !== !p.parent_id) {
      throw new ZohoCrmError('Give parent_module and parent_id together, or neither.');
    }
    const path = p.parent_module
      ? `/${encodeURIComponent(requireApiName({ value: p.parent_module, name: 'parent_module' }))}/${requireId({ value: p.parent_id, name: 'parent_id' })}/Notes`
      : '/Notes';
    const page = optionalInt({ value: p.page, name: 'page', min: 1, max: 2000 });
    const perPage = optionalInt({ value: p.per_page, name: 'per_page', min: 1, max: 200 }) ?? 50;
    validatePaging({ page, perPage, tokenSupported: false });
    const body = await zohoRequest<ZohoListResponse<Record<string, unknown>>>({
      auth,
      method: HttpMethod.GET,
      path,
      query: {
        fields: NOTE_FIELDS,
        per_page: String(perPage),
        ...(page ? { page: String(page) } : {}),
      },
    });
    const notes = (body?.data ?? []).map(flattenNote);
    return { notes, count: notes.length, more_records: body?.info?.more_records === true };
  },
});

export const getNoteAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_get_note',
  classification: 'READ',
  displayName: 'Get Note',
  description: 'Gets a note by id.',
  audience: 'ai',
  aiMetadata: {
    description: 'Fetches one Zoho CRM note by id with its title, content, parent record and owner. Read-only and idempotent.',
    idempotent: true,
  },
  props: { note_id: noteId },
  outputSchema: noteOutputSchema,
  async run({ auth, propsValue }) {
    const id = requireId({ value: propsValue.note_id, name: 'note_id' });
    const body = await zohoRequest<ZohoListResponse<Record<string, unknown>>>({
      auth,
      method: HttpMethod.GET,
      path: `/Notes/${id}`,
      query: { fields: NOTE_FIELDS },
    });
    const note = body?.data?.[0];
    if (!note) throw new ZohoCrmError(`No note with id ${id} was found.`, 404, 'NOT_FOUND');
    return flattenNote(note);
  },
});

export const createNoteAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_create_note',
  classification: 'WRITE',
  displayName: 'Create Note',
  description: 'Adds a note to a record.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a note (content required, title optional) to one Zoho CRM record identified by module API name and record id. Use to log context such as a call summary. Not idempotent: each call adds another note.',
    idempotent: false,
  },
  props: {
    parent_module: moduleApiName,
    parent_id: Property.ShortText({ displayName: 'Parent Record ID', required: true }),
    title: Property.ShortText({ displayName: 'Title', required: false }),
    content: Property.LongText({ displayName: 'Content', required: true }),
  },
  outputSchema: noteWriteOutputSchema,
  async run({ auth, propsValue: p }) {
    return createNote({
      auth,
      module: requireApiName({ value: p.parent_module, name: 'parent_module' }),
      recordId: requireId({ value: p.parent_id, name: 'parent_id' }),
      title: p.title,
      content: p.content,
    });
  },
});

export const updateNoteAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_update_note',
  classification: 'WRITE',
  displayName: 'Update Note',
  description: 'Changes the title or content of a note.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes the title and/or content of one Zoho CRM note; a field you leave out keeps its value (only title and content can change). Idempotent: re-sending the same text converges on the same note.',
    idempotent: true,
  },
  props: {
    note_id: noteId,
    title: Property.ShortText({ displayName: 'Title', required: false }),
    content: Property.LongText({ displayName: 'Content', required: false }),
  },
  outputSchema: noteChangeOutputSchema,
  async run({ auth, propsValue: p }) {
    const id = requireId({ value: p.note_id, name: 'note_id' });
    const data: Record<string, unknown> = {};
    if (p.title !== undefined && p.title !== null && p.title !== '') data['Note_Title'] = p.title;
    if (p.content !== undefined && p.content !== null && p.content !== '') data['Note_Content'] = p.content;
    if (Object.keys(data).length === 0) {
      throw new ZohoCrmError('Give a new title or content.');
    }
    const body = await zohoRequest<unknown>({ auth, method: HttpMethod.PUT, path: `/Notes/${id}`, body: { data: [data] } });
    return { ...flattenWriteResult(unwrapWriteItem({ body })), id };
  },
});

export const deleteNoteAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_delete_note',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Note',
  description: 'Deletes a note.',
  audience: 'ai',
  aiMetadata: {
    description: 'Deletes one Zoho CRM note by id. Only use when asked to remove the note. Not idempotent: deleting it again returns an error.',
    idempotent: false,
  },
  props: { note_id: noteId },
  outputSchema: noteChangeOutputSchema,
  async run({ auth, propsValue }) {
    const id = requireId({ value: propsValue.note_id, name: 'note_id' });
    let body: unknown;
    try {
      body = await zohoRequest<unknown>({ auth, method: HttpMethod.DELETE, path: `/Notes/${id}` });
    } catch (error) {
      throw notDeletedError({ error, what: `note ${id}` });
    }
    return { ...flattenWriteResult(unwrapWriteItem({ body })), id };
  },
});

export const listTagsAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_list_tags',
  classification: 'SEARCH',
  displayName: 'List Tags',
  description: 'Lists the tags of a module.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists the tags defined for one Zoho CRM module (name, id, color). Use to check tag names before Add Tags or Remove Tags. Read-only and idempotent.',
    idempotent: true,
  },
  props: { module_api_name: moduleApiName },
  outputSchema: listTagsOutputSchema,
  async run({ auth, propsValue }) {
    const module = requireApiName({ value: propsValue.module_api_name, name: 'module_api_name' });
    const tags = (await listTags({ auth, module: module })).map((t) => ({
      id: t.id,
      name: t.name,
      color_code: t.color_code ?? null,
      created_time: t.created_time ?? null,
      modified_time: t.modified_time ?? null,
    }));
    return { module, tags, count: tags.length };
  },
});

export const createTagAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_create_tag',
  classification: 'WRITE',
  displayName: 'Create Tag',
  description: 'Creates a tag in a module, or returns it if it exists.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Gets or creates a tag by name (case-insensitive) in one Zoho CRM module, returning created false when it already existed. Use before Add Tags when the tag may be new; a module holds at most 100 tags. Idempotent: repeating returns the same tag.',
    idempotent: true,
  },
  props: {
    module_api_name: moduleApiName,
    name: Property.ShortText({ displayName: 'Tag Name', required: true }),
    color_code: Property.StaticDropdown({
      displayName: 'Color',
      required: false,
      options: { options: TAG_COLORS.map((c) => ({ label: c, value: c })) },
    }),
  },
  outputSchema: createTagOutputSchema,
  async run({ auth, propsValue: p }) {
    const module = requireApiName({ value: p.module_api_name, name: 'module_api_name' });
    const { tag, created } = await ensureTag({ auth, module, name: p.name, colorCode: p.color_code });
    return { id: tag.id, name: tag.name, color_code: tag.color_code ?? null, module, created };
  },
});

const tagNames = Property.Array({ displayName: 'Tag Names', description: 'Tag names, e.g. ["VIP", "Webinar 2026"].', required: true });
const recordIds = Property.Array({ displayName: 'Record IDs', description: 'Numeric record ids (max 500).', required: true });

function tagInputs(p: { module_api_name: unknown; record_ids: unknown; tags: unknown }) {
  const module = requireApiName({ value: p.module_api_name, name: 'module_api_name' });
  const ids = stringList(p.record_ids).map((id) => requireId({ value: id, name: 'record_ids' }));
  const names = stringList(p.tags);
  if (names.length > 10) throw new ZohoCrmError('Zoho allows at most 10 tags per record.');
  return { module, ids, tags: names.map((name) => ({ name })) };
}

export const addTagsAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_add_tags',
  classification: 'WRITE',
  displayName: 'Add Tags',
  description: 'Adds tags to one or more records.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds tags by name to up to 500 records of one Zoho CRM module, keeping tags the records already have (max 10 per record). A tag name the module does not have yet is created by Zoho on the fly; use Create Tag first only to pick its color. Idempotent: re-adding an existing tag changes nothing.',
    idempotent: true,
  },
  props: { module_api_name: moduleApiName, record_ids: recordIds, tags: tagNames },
  outputSchema: tagChangeOutputSchema,
  async run({ auth, propsValue }) {
    const { module, ids, tags } = tagInputs(propsValue);
    return changeTags({ auth, module, recordIds: ids, tags, mode: 'add' });
  },
});

export const removeTagsAtomic = createAction({
  auth: zohoCrmAuth,
  name: 'zoho_crm_remove_tags',
  classification: 'WRITE',
  displayName: 'Remove Tags',
  description: 'Removes tags from one or more records.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes tags by name from up to 500 records of one Zoho CRM module; the tags themselves stay defined in the module. Idempotent: removing a tag that is not on a record changes nothing.',
    idempotent: true,
  },
  props: { module_api_name: moduleApiName, record_ids: recordIds, tags: tagNames },
  outputSchema: tagChangeOutputSchema,
  async run({ auth, propsValue }) {
    const { module, ids, tags } = tagInputs(propsValue);
    return changeTags({ auth, module, recordIds: ids, tags, mode: 'remove' });
  },
});
