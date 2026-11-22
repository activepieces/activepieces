import { Property } from '@activepieces/pieces-framework';
import { ABSENCE_TYPE_OPTIONS, COLOR_OPTIONS } from '../../common';
import { clockodoRequests } from '../../common/requests';

function id({ displayName, source, required }: { displayName: string; source: string; required: boolean }) {
  return Property.ShortText({
    displayName,
    description: `Numeric Clockodo ID, for example 123456. Find it with ${source}.`,
    required,
  });
}

function isoDate({ displayName, required }: { displayName: string; required: boolean }) {
  return Property.ShortText({
    displayName,
    description: 'ISO-8601 calendar date, YYYY-MM-DD, for example 2026-03-31.',
    required,
  });
}

function isoDateTime({ displayName, required }: { displayName: string; required: boolean }) {
  return Property.ShortText({
    displayName,
    description: 'ISO-8601 date-time with timezone, for example 2026-03-31T09:00:00Z or 2026-03-31T11:00:00+02:00.',
    required,
  });
}

function yesNo({ displayName, description }: { displayName: string; description: string }) {
  return Property.StaticDropdown<string, false>({
    displayName,
    description: `${description} Leave empty to not send this field.`,
    required: false,
    options: {
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
  });
}

function color() {
  return Property.StaticDropdown<string, false>({
    displayName: 'Color',
    description: 'Display color of the customer.',
    required: false,
    options: {
      options: COLOR_OPTIONS.map((o) => ({ label: o.label, value: o.name })),
    },
  });
}

function absenceType({ required }: { required: boolean }) {
  return Property.StaticDropdown<string, boolean>({
    displayName: 'Type',
    description: 'Absence type code as a string, for example "1" = regular holiday, "4" = sick day, "8" = home office.',
    required,
    options: {
      options: ABSENCE_TYPE_OPTIONS.map((o) => ({ label: `${o.value}: ${o.label}`, value: o.value })),
    },
  });
}

function absenceStatus() {
  return Property.StaticDropdown<string, false>({
    displayName: 'Status',
    description: 'New status of the absence.',
    required: false,
    options: {
      options: Object.keys(ABSENCE_STATUS_CHOICES).map((value) => ({ label: value.replace('_', ' '), value })),
    },
  });
}

function language() {
  return Property.StaticDropdown<string, false>({
    displayName: 'Language',
    description: 'Interface language of the user.',
    required: false,
    options: {
      options: [
        { label: 'German', value: 'de' },
        { label: 'English', value: 'en' },
        { label: 'French', value: 'fr' },
      ],
    },
  });
}

function wageType() {
  return Property.StaticDropdown<string, false>({
    displayName: 'Wage Type',
    description: 'How the user is paid.',
    required: false,
    options: {
      options: [
        { label: 'Salary', value: 'salary' },
        { label: 'Hourly wage', value: 'hourly' },
      ],
    },
  });
}

function parseColor(value: string | undefined | null): number | undefined {
  return clockodoRequests.parseChoice({ value, field: 'Color', choices: COLOR_CHOICES });
}

function parseAbsenceType(value: string | undefined | null): number | undefined {
  return clockodoRequests.parseChoice({ value, field: 'Type', choices: ABSENCE_TYPE_CHOICES });
}

function parseAbsenceStatus(value: string | undefined | null): number | undefined {
  return clockodoRequests.parseChoice({ value, field: 'Status', choices: ABSENCE_STATUS_CHOICES });
}

function parseLanguage(value: string | undefined | null): string | undefined {
  return clockodoRequests.parseChoice({ value, field: 'Language', choices: LANGUAGE_CHOICES });
}

function parseWageType(value: string | undefined | null): number | undefined {
  return clockodoRequests.parseChoice({ value, field: 'Wage Type', choices: WAGE_TYPE_CHOICES });
}

function optionalIsoDateTime({ value, field }: { value: string | undefined | null; field: string }): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return clockodoRequests.parseIsoDateTime({ value, field });
}

function optionalIsoDate({ value, field }: { value: string | undefined | null; field: string }): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return clockodoRequests.parseIsoDate({ value, field });
}

const COLOR_CHOICES: Record<string, number> = {
  ...Object.fromEntries(COLOR_OPTIONS.map((o) => [o.name, o.index])),
  caribbean: 4,
  lightblue: 5,
};
const ABSENCE_TYPE_CHOICES: Record<string, number> = Object.fromEntries(
  ABSENCE_TYPE_OPTIONS.map((o) => [o.value, Number(o.value)])
);
const ABSENCE_STATUS_CHOICES: Record<string, number> = {
  requested: 0,
  approved: 1,
  declined: 2,
  approval_cancelled: 3,
  request_cancelled: 4,
};
const LANGUAGE_CHOICES: Record<string, string> = { de: 'de', en: 'en', fr: 'fr' };
const WAGE_TYPE_CHOICES: Record<string, number> = { salary: 1, hourly: 2 };

export const clockodoAiProps = {
  id,
  isoDate,
  isoDateTime,
  yesNo,
  color,
  absenceType,
  absenceStatus,
  language,
  wageType,
  parseColor,
  parseAbsenceType,
  parseAbsenceStatus,
  parseLanguage,
  parseWageType,
  optionalIsoDateTime,
  optionalIsoDate,
};
