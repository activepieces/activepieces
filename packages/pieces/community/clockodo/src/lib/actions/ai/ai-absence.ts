import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../../common';
import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { clockodoAuth } from '../../auth';
import { clockodoAiProps } from './ai-props';

export const aiCreateAbsence = createAction({
  auth: clockodoAuth,
  name: 'ai_create_absence',
  classification: 'WRITE',
  displayName: 'Create Absence',
  description: 'Creates an absence in Clockodo',
  audience: 'ai',
  outputSchema: clockodoOutputSchemas.absence,
  aiMetadata: {
    description:
      'Creates a Clockodo absence (vacation, sick day, home office...) between two ISO dates YYYY-MM-DD for a user id (defaults to the connection user). Type is a code string "1"-"15". approved "yes" records it as approved (needs absence-manager rights), otherwise it is a request. Not idempotent.',
    idempotent: false,
  },
  props: {
    date_since: clockodoAiProps.isoDate({ displayName: 'Start Date', required: true }),
    date_until: clockodoAiProps.isoDate({ displayName: 'End Date', required: true }),
    type: clockodoAiProps.absenceType({ required: true }),
    user_id: clockodoAiProps.id({ displayName: 'User ID', source: 'Get Users or Get Current User', required: false }),
    half_days: clockodoAiProps.yesNo({ displayName: 'Half Day', description: 'Whether the absence is a half day (single-day absences).' }),
    approved: clockodoAiProps.yesNo({ displayName: 'Approved', description: 'Record as approved instead of requested.' }),
    note: Property.LongText({ displayName: 'Note', placeholder: 'e.g. Agreed by phone', required: false }),
    sick_note: clockodoAiProps.yesNo({ displayName: 'Sick Note', description: 'Whether a sick note exists.' }),
  },
  async run({ auth, propsValue }) {
    return makeClient(auth.props).createAbsence(
      clockodoRequests.absenceCreateBody({
        date_since: clockodoRequests.parseIsoDate({ value: propsValue.date_since, field: 'Start Date' }),
        date_until: clockodoRequests.parseIsoDate({ value: propsValue.date_until, field: 'End Date' }),
        type: clockodoRequests.requireValue({ value: clockodoAiProps.parseAbsenceType(propsValue.type), field: 'Type' }),
        users_id: clockodoRequests.parseOptionalId({ value: propsValue.user_id, field: 'User ID' }),
        half_days: clockodoRequests.parseYesNo({ value: propsValue.half_days, field: 'Half Day' }),
        approved: clockodoRequests.parseYesNo({ value: propsValue.approved, field: 'Approved' }),
        note: clockodoRequests.optionalText(propsValue.note),
        sick_note: clockodoRequests.parseYesNo({ value: propsValue.sick_note, field: 'Sick Note' }),
      })
    );
  },
});

export const aiUpdateAbsence = createAction({
  auth: clockodoAuth,
  name: 'ai_update_absence',
  classification: 'WRITE',
  displayName: 'Update Absence',
  description: 'Updates an absence in Clockodo',
  audience: 'ai',
  outputSchema: clockodoOutputSchemas.absence,
  aiMetadata: {
    description:
      'Changes only the fields you give on a Clockodo absence identified by numeric absence id: ISO dates YYYY-MM-DD, type code "1"-"15", status (requested, approved, declined, approval_cancelled, request_cancelled), half day, note or sick note. Use status approved/declined to answer a request; Clockodo allows only some transitions (approved can become approval_cancelled, not declined). Idempotent.',
    idempotent: true,
  },
  props: {
    absence_id: clockodoAiProps.id({ displayName: 'Absence ID', source: 'Get Absences', required: true }),
    date_since: clockodoAiProps.isoDate({ displayName: 'Start Date', required: false }),
    date_until: clockodoAiProps.isoDate({ displayName: 'End Date', required: false }),
    type: clockodoAiProps.absenceType({ required: false }),
    status: clockodoAiProps.absenceStatus(),
    half_days: clockodoAiProps.yesNo({ displayName: 'Half Day', description: 'yes makes it a half day; no turns a half day back into a full day.' }),
    note: Property.LongText({ displayName: 'Note', placeholder: 'e.g. Agreed by phone', required: false }),
    sick_note: clockodoAiProps.yesNo({ displayName: 'Sick Note', description: 'Whether a sick note exists.' }),
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.absence_id, field: 'Absence ID' });
    const client = makeClient(auth.props);
    const half_days = clockodoRequests.parseYesNo({ value: propsValue.half_days, field: 'Half Day' });
    return client.updateAbsence({
      id,
      request: clockodoRequests.absenceUpdateBody({
        date_since: clockodoAiProps.optionalIsoDate({ value: propsValue.date_since, field: 'Start Date' }),
        date_until: clockodoAiProps.optionalIsoDate({ value: propsValue.date_until, field: 'End Date' }),
        type: clockodoAiProps.parseAbsenceType(propsValue.type),
        status: clockodoAiProps.parseAbsenceStatus(propsValue.status),
        half_days,
        note: clockodoRequests.optionalText(propsValue.note),
        sick_note: clockodoRequests.parseYesNo({ value: propsValue.sick_note, field: 'Sick Note' }),
      }),
    });
  },
});

export const aiListAbsences = createAction({
  auth: clockodoAuth,
  name: 'ai_list_absences',
  classification: 'SEARCH',
  displayName: 'Get Absences',
  description: 'Fetches absences from Clockodo',
  audience: 'ai',
  outputSchema: clockodoOutputSchemas.absences,
  aiMetadata: {
    description:
      'Lists Clockodo absences of one calendar year (four-digit year string like "2026"), optionally of one numeric user id, following every page. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    year: Property.ShortText({ displayName: 'Year', description: 'Four-digit year, for example 2026.', required: true }),
    user_id: clockodoAiProps.id({ displayName: 'User ID', source: 'Get Users', required: false }),
  },
  async run({ auth, propsValue }) {
    const absences = await makeClient(auth.props).listAbsences({
      year: clockodoRequests.parseYear({ value: propsValue.year, field: 'Year' }),
      users_id: clockodoRequests.parseOptionalId({ value: propsValue.user_id, field: 'User ID' }),
    });
    return { absences };
  },
});
