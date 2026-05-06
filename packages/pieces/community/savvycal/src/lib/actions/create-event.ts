import {
  createAction,
  Property,
  DynamicPropsValue,
  InputPropertyMap,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  savvyCalApiCall,
  flattenEvent,
  buildTeamOptions,
  buildLinkOptions,
  SavvyCalEvent,
  SavvyCalSchedulingLink,
  SavvyCalLinkField,
} from '../common';
import { savvyCalAuth, getToken } from '../auth';

export const createEventAction = createAction({
  auth: savvyCalAuth,
  name: 'create_event',
  displayName: 'Create Event',
  description: 'Books a meeting on a scheduling link at a specific time slot.',
  props: {
    team_id: Property.Dropdown({
      auth: savvyCalAuth,
      displayName: 'Team',
      description: 'Filter scheduling links by team. Leave empty to show all teams.',
      refreshers: [],
      required: false,
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
        try {
          const options = await buildTeamOptions(getToken(auth));
          return { disabled: false, options };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load teams.' };
        }
      },
    }),
    link_id: Property.Dropdown({
      auth: savvyCalAuth,
      displayName: 'Scheduling Link',
      description: 'Select the scheduling link to book a meeting on.',
      refreshers: ['team_id'],
      required: true,
      options: async ({ auth, team_id }) => {
        if (!auth)
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        try {
          const options = await buildLinkOptions(getToken(auth), team_id as string | null);
          return { disabled: false, options };
        } catch {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load scheduling links. Check your connection.',
          };
        }
      },
    }),
    start_at: Property.DateTime({
      displayName: 'Start Time',
      description:
        'The start date and time of the meeting. Must match an available slot on the scheduling link.',
      required: true,
    }),
    end_at: Property.DateTime({
      displayName: 'End Time',
      description: 'The End date and time of the meeting',
      required: true,
    }),
    attendee_name: Property.ShortText({
      displayName: 'Attendee Name',
      description: 'Full name of the person booking the meeting.',
      required: true,
    }),
    attendee_email: Property.ShortText({
      displayName: 'Attendee Email',
      description: 'Email address of the person booking the meeting.',
      required: true,
    }),
    time_zone: Property.ShortText({
      displayName: 'Time Zone',
      description:
        "Attendee's local time zone in Olson format (e.g. America/New_York, Europe/London, Africa/Lagos).",
      required: true,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description:
        "Attendee's phone number in international format (e.g. +15555555555). Required only if the scheduling link asks for it.",
      required: false,
    }),
    custom_fields: Property.DynamicProperties({
      auth: savvyCalAuth,
      displayName: 'Custom Fields',
      description:
        'Additional questions configured on the scheduling link (e.g. Company, Why are we meeting?). Filled in dynamically based on the selected link.',
      required: false,
      refreshers: ['link_id'],
      props: async ({ auth, link_id }) => {
        if (!auth || !link_id) return {} as InputPropertyMap;
        const fields = await fetchLinkFields(getToken(auth), link_id as unknown as string);
        return buildCustomFieldProps(fields);
      },
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description:
        'Custom key/value pairs to attach to the event. Useful for tracking the source flow or correlating with external systems.',
      required: false,
    }),
  },
  async run(context) {
    const token = getToken(context.auth);
    const {
      link_id,
      start_at,
      end_at,
      attendee_name,
      attendee_email,
      time_zone,
      phone_number,
      custom_fields,
      metadata,
    } = context.propsValue;

    const linkFields = await fetchLinkFields(token, link_id);
    const submittedFields = serializeCustomFields({
      linkFields,
      customFields: custom_fields,
    });

    const body: Record<string, unknown> = {
      start_at,
      end_at,
      display_name: attendee_name,
      email: attendee_email,
      time_zone,
    };
    if (phone_number) body['phone_number'] = phone_number;
    if (submittedFields.length > 0) body['fields'] = submittedFields;
    if (metadata && Object.keys(metadata).length > 0) body['metadata'] = metadata;

    const response = await savvyCalApiCall<SavvyCalEvent>({
      token,
      method: HttpMethod.POST,
      path: `/links/${link_id}/events`,
      body,
    });
    return flattenEvent(response.body);
  },
});

async function fetchLinkFields(token: string, linkId: string): Promise<SavvyCalLinkField[]> {
  try {
    const response = await savvyCalApiCall<SavvyCalSchedulingLink>({
      token,
      method: HttpMethod.GET,
      path: `/links/${linkId}`,
    });
    return response.body.fields ?? [];
  } catch {
    return [];
  }
}

function buildCustomFieldProps(fields: SavvyCalLinkField[]): InputPropertyMap {
  const props: DynamicPropsValue = {};
  for (const field of fields) {
    if (isHiddenFieldType(field.type)) continue;
    const params = {
      displayName: field.label,
      required: field.is_required ?? false,
    };
    const choices = normalizeFieldOptions(field);
    if (isMultiSelectFieldType(field.type)) {
      props[field.id] = Property.StaticMultiSelectDropdown({
        ...params,
        options: { options: choices },
      });
    } else if (isSingleSelectFieldType(field.type)) {
      props[field.id] = Property.StaticDropdown({
        ...params,
        options: { options: choices },
      });
    } else if (isLongTextFieldType(field.type)) {
      props[field.id] = Property.LongText(params);
    } else {
      props[field.id] = Property.ShortText(params);
    }
  }
  return props as InputPropertyMap;
}

function serializeCustomFields({
  linkFields,
  customFields,
}: {
  linkFields: SavvyCalLinkField[];
  customFields: DynamicPropsValue | undefined;
}): Array<{ id: string; label: string; type: string; value: string }> {
  if (!customFields) return [];
  const result: Array<{ id: string; label: string; type: string; value: string }> = [];
  for (const field of linkFields) {
    const raw = customFields[field.id];
    if (raw === undefined || raw === null || raw === '') continue;
    const value = Array.isArray(raw) ? raw.join(', ') : String(raw);
    result.push({ id: field.id, label: field.label, type: field.type, value });
  }
  return result;
}

function normalizeFieldOptions(field: SavvyCalLinkField): Array<{ label: string; value: string }> {
  const raw = field.options ?? field.choices ?? [];
  return raw.map((opt) => {
    if (typeof opt === 'string') return { label: opt, value: opt };
    return {
      label: opt.label ?? opt.name ?? opt.value ?? opt.id ?? '',
      value: opt.value ?? opt.id ?? opt.name ?? opt.label ?? '',
    };
  });
}

function isMultiSelectFieldType(type: string): boolean {
  const t = type.toLowerCase();
  return t === 'checkboxes' || t === 'multi_select' || t === 'checkbox_group';
}

function isSingleSelectFieldType(type: string): boolean {
  const t = type.toLowerCase();
  return (
    t === 'select' ||
    t === 'select_menu' ||
    t === 'dropdown' ||
    t === 'radio' ||
    t === 'radio_buttons' ||
    t === 'single_select'
  );
}

function isLongTextFieldType(type: string): boolean {
  const t = type.toLowerCase();
  return t === 'long_text' || t === 'textarea' || t === 'paragraph';
}

function isHiddenFieldType(type: string): boolean {
  return type.toLowerCase() === 'hidden';
}
