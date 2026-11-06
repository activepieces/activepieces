import { Property } from '@activepieces/pieces-framework';

function formId<R extends boolean>({
  required,
  displayName = 'Form ID',
  description = 'Numeric form id, e.g. "14". Use List Forms to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function entryId<R extends boolean>({
  required,
  displayName = 'Entry ID',
  description = 'Numeric entry id, e.g. "159". Use List Entries to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function inputValues<R extends boolean>({
  required,
  displayName = 'Input Values',
  description = 'Object of input names to values, e.g. {"input_1":"Jane","input_2_3":"Doe","input_5":"jane@example.com"}. Names are input_<field id>, with _<sub id> for sub-inputs like name parts; get field ids from Get Form.',
}: PropParams<R>) {
  return Property.Json({ displayName, description, required });
}

function populationValues<R extends boolean>({
  required,
  displayName = 'Dynamic Population Values',
  description = 'Object of dynamic population parameter names to values, used to evaluate conditional logic, e.g. {"source":"agent"}. Defaults to none.',
}: PropParams<R>) {
  return Property.Json({ displayName, description, required });
}

function sourcePage<R extends boolean>({
  required,
  displayName = 'Source Page',
  description = 'Multi-page forms only: the page the values were submitted from. Defaults to 1.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function targetPage<R extends boolean>({
  required,
  displayName = 'Target Page',
  description = 'Multi-page forms only: the page to go to next if this page is valid; 0 submits the form. Defaults to 0.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function status<R extends boolean>({
  required,
  displayName = 'Entry Status',
  description = 'Which entries to include: "active", "spam" or "trash". Defaults to "active".',
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Spam', value: 'spam' },
        { label: 'Trash', value: 'trash' },
      ],
    },
  });
}

function fieldFilters<R extends boolean>({
  required,
  displayName = 'Field Filters',
  description = 'Array of filters, e.g. [{"key":"1","value":"Jane","operator":"contains"}]. key is a field id, entry property (e.g. "date_created", "is_starred") or meta key; operator is one of =, is, isnot, <>, contains, like, in, notin and defaults to "=". Use List Field Filters to see valid keys. Defaults to no filter.',
}: PropParams<R>) {
  return Property.Json({ displayName, description, required });
}

function filterMode<R extends boolean>({
  required,
  displayName = 'Filter Mode',
  description = '"all" matches entries that pass every filter, "any" entries that pass at least one. Defaults to "all".',
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      options: [
        { label: 'All', value: 'all' },
        { label: 'Any', value: 'any' },
      ],
    },
  });
}

function fieldValues<R extends boolean>({
  required,
  displayName = 'Field Values',
  description = 'Object of field ids to values, e.g. {"1":"Jane","2.3":"Doe","5":"jane@example.com"}. Sub-inputs like name parts use <field id>.<sub id>; get ids from Get Form.',
}: PropParams<R>) {
  return Property.Json({ displayName, description, required });
}

function entryProperties<R extends boolean>({
  required,
  displayName = 'Entry Properties',
  description = 'Other Entry Object properties, e.g. {"is_starred":1,"is_read":1,"status":"active","created_by":1,"source_url":"https://example.com/contact"}. Defaults to none.',
}: PropParams<R>) {
  return Property.Json({ displayName, description, required });
}

function feedId<R extends boolean>({
  required,
  displayName = 'Feed ID',
  description = 'Numeric add-on feed id, e.g. "3". Use List Feeds to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function force<R extends boolean>({
  required,
  displayName = 'Delete Permanently',
  description = '"true" deletes permanently and cannot be undone. Defaults to "false", which moves it to the trash.',
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      options: [
        { label: 'Yes', value: 'true' },
        { label: 'No', value: 'false' },
      ],
    },
  });
}

export const gravityFormsAiProps = {
  formId,
  entryId,
  feedId,
  inputValues,
  populationValues,
  sourcePage,
  targetPage,
  status,
  fieldFilters,
  filterMode,
  fieldValues,
  entryProperties,
  force,
};

export type PropParams<R extends boolean> = { required: R; displayName?: string; description?: string };
