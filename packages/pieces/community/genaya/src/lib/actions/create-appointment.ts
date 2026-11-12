import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { genayaAuth } from '../auth';
import { genayaApi } from '../common/client';
import { genayaInput } from '../common/input';
import { genayaOutput } from '../common/mappers';
import { genayaProps } from '../common/props';
import { GenayaAppointment } from '../common/types';

const LOCAL_TIME_HELP =
  'Use your organization\'s local time written as YYYY-MM-DD HH:mm, for example 2026-08-10 09:00. A timestamp that carries a time zone (ending in Z or an offset such as -05:00) is read in UTC, so convert it to local time first, for example with the Date Helper piece.';

export const createAppointment = createAction({
  auth: genayaAuth,
  name: 'create_appointment',
  classification: 'WRITE',
  displayName: 'Create Appointment',
  description: 'Creates an appointment (a job, visit, session or project) on the Genaya schedule.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create an appointment on the Genaya schedule, linked to an existing client by ID or to a client matched or created from the contact fields. Start and end are organization-local wall-clock times (YYYY-MM-DD HH:mm). The organization can make fields such as the address mandatory, and Genaya then rejects the request naming the missing field. Each call creates a new appointment, so retries duplicate.',
    idempotent: false,
  },
  props: {
    client: genayaProps.clientDropdown({
      required: false,
      description:
        'Link the appointment to an existing client. The list shows your 100 most recent clients; map the ID from an earlier step (for example Find Client) to use any other. Leave empty to match or create the client from the contact fields below.',
    }),
    first_name: Property.ShortText({
      displayName: 'Client First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Client Last Name',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Client Company',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Client Email',
      description: 'For example jordan@example.com.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Client Phone',
      description: 'Preferably in international format, for example +14155550142.',
      required: false,
    }),
    appointment_type: genayaProps.appointmentTypeDropdown,
    start: Property.ShortText({
      displayName: 'Start',
      description: `When the appointment starts. ${LOCAL_TIME_HELP}`,
      required: false,
    }),
    end: Property.ShortText({
      displayName: 'End',
      description: 'When the appointment ends, in the same format as Start.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'What the appointment is about, for example "AC not cooling on the second floor".',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Defaults to Submitted.',
      required: false,
      options: {
        options: [
          { label: 'Submitted', value: 'Submitted' },
          { label: 'Pending', value: 'Pending' },
          { label: 'In Progress', value: 'In Progress' },
          { label: 'Estimate', value: 'Estimate' },
          { label: 'Done', value: 'Done' },
          { label: 'Canceled', value: 'Canceled' },
        ],
      },
    }),
    team: genayaProps.teamMembersDropdown({
      description: 'Team members to assign to the appointment.',
    }),
    ...genayaProps.addressProps(),
    service_area: Property.ShortText({
      displayName: 'Service Area',
      description: 'The service area name, when your organization uses service areas.',
      required: false,
    }),
    lead_source: Property.ShortText({
      displayName: 'Lead Source',
      description: 'How the client found you, for example Google.',
      required: false,
    }),
    total: Property.Number({
      displayName: 'Total',
      description: 'The quoted price, tax included, for example 189. Leave empty when the price is not known yet.',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Adds a note to the appointment, signed by the owner of the API key.',
      required: false,
    }),
    custom_fields: Property.Object({
      displayName: 'Custom Fields',
      description:
        'Values for your organization\'s own appointment fields, keyed by field ID. Needed only when one of them is mandatory.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const teamIds = genayaInput.textList(props.team);
    const body = genayaInput.compact({
      clientId: genayaInput.text(props.client),
      firstName: genayaInput.text(props.first_name),
      lastName: genayaInput.text(props.last_name),
      company: genayaInput.text(props.company),
      email: genayaInput.text(props.email),
      phone: genayaInput.text(props.phone),
      appointmentTypeId: genayaInput.text(props.appointment_type),
      startAt: genayaInput.text(props.start),
      endAt: genayaInput.text(props.end),
      description: genayaInput.text(props.description),
      status: genayaInput.text(props.status),
      team: teamIds.length > 0 ? teamIds.map((id) => ({ id })) : undefined,
      address: genayaInput.address({
        line1: props.address_line1,
        unit: props.address_unit,
        city: props.address_city,
        state: props.address_state,
        zip: props.address_zip,
        country: props.address_country,
      }),
      serviceArea: genayaInput.text(props.service_area),
      leadSource: genayaInput.text(props.lead_source),
      total: genayaInput.number(props.total),
      note: genayaInput.text(props.note),
      customFields: genayaInput.record(props.custom_fields),
    });
    const response = await genayaApi.request<{ data: GenayaAppointment }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/appointments',
      body,
    });
    return genayaOutput.appointment(response.data);
  },
});
