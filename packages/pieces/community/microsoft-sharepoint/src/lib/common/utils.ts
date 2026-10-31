import type { DriveRecipient } from '@microsoft/microsoft-graph-types';

function booleanChoice({
  value,
  propName,
}: {
  value: string | undefined;
  propName: string;
}): boolean | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }
  if (value !== 'true' && value !== 'false') {
    throw new Error(`${propName} must be "true" or "false".`);
  }
  return value === 'true';
}

function optionalText({ key, value }: { key: string; value: string | undefined }): Record<string, string> {
  return value === undefined ? {} : { [key]: value };
}

function optionalBoolean({
  key,
  value,
  propName,
}: {
  key: string;
  value: string | undefined;
  propName: string;
}): Record<string, boolean> {
  const parsed = booleanChoice({ value, propName });
  return parsed === undefined ? {} : { [key]: parsed };
}

function toRecipients({ emails, propName }: { emails: unknown[]; propName: string }): DriveRecipient[] {
  return emails.map((email) => {
    if (typeof email !== 'string') {
      throw new Error(`${propName} must be a list of email addresses.`);
    }
    return { email };
  });
}

function shareToken({ share }: { share: string }): string {
  if (!/^https?:\/\//i.test(share)) {
    return share;
  }
  return `u!${Buffer.from(share, 'utf8').toString('base64url')}`;
}

function odataString({ value }: { value: string }): string {
  return `'${encodeURIComponent(value.replace(/'/g, "''"))}'`;
}

function activitiesByIntervalFunction({
  startDateTime,
  endDateTime,
  interval,
}: {
  startDateTime: string;
  endDateTime: string;
  interval: string;
}): string {
  if (!INTERVALS.includes(interval)) {
    throw new Error('Interval must be "day", "week" or "month".');
  }
  return `getActivitiesByInterval(startDateTime=${odataString({ value: startDateTime })},endDateTime=${odataString({ value: endDateTime })},interval=${odataString({ value: interval })})`;
}

function analyticsPeriod({ value }: { value: string | undefined }): string {
  const period = value || 'allTime';
  if (period !== 'allTime' && period !== 'lastSevenDays') {
    throw new Error('Period must be "allTime" or "lastSevenDays".');
  }
  return period;
}

function toSiteIds({ values }: { values: unknown[] }): string[] {
  if (values.length === 0) {
    throw new Error('Site IDs must contain at least one site ID.');
  }
  return values.map((value) => {
    if (typeof value !== 'string' || value === '') {
      throw new Error('Every entry of Site IDs must be a non-empty site ID string.');
    }
    return value;
  });
}

function operationIdFromLocation({ location }: { location: string | null }): string | null {
  if (location === null) {
    return null;
  }
  const segment = new URL(location).pathname.split('/').pop();
  return segment ? decodeURIComponent(segment) : null;
}

export const microsoftSharePointUtils = {
  booleanChoice,
  optionalText,
  optionalBoolean,
  toRecipients,
  shareToken,
  activitiesByIntervalFunction,
  analyticsPeriod,
  toSiteIds,
  operationIdFromLocation,
};

const INTERVALS = ['day', 'week', 'month'];
