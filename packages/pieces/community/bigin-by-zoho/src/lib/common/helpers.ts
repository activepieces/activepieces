import { DATA_CENTER_REGIONS } from "./constants";

export function handleDropdownError(msg: string) {
  return {
    disabled: true,
    options: [],
    placeholder: msg,
  };
}

export function getSafeLabel(item: any): string {
  if (item.First_Name || item.Last_Name) {
    return `${item.First_Name ?? ''} ${item.Last_Name ?? ''}`.trim();
  }
  return (
    item?.Deal_Name || item?.Pipeline_Name || item?.Account_Name || item?.id
  );
}

export function formatDateTime(input: string | Date): string {
  const date = new Date(input);

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date provided');
  }

  return date.toISOString().replace(/\.\d{3}Z$/, '+00:00');
}

export function formatDateOnly(input: string | Date): string {
  if (typeof input === 'string') {
    const datePart = /^(\d{4}-\d{2}-\d{2})/.exec(input.trim());
    if (datePart) {
      return datePart[1];
    }
  }
  const date = new Date(input);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
}

export function getZohoBiginAccountAuthorizationUrl(
  region: (typeof DATA_CENTER_REGIONS)[number]['REGION']
) {
  if (region === 'CN') {
    return 'https://accounts.zoho.com.cn';
  }

  return 'https://accounts.zoho.com';
}

export function escapeCriteriaValue(value: string): string {
  return value.replace(/[\\(),]/g, (ch) => `\\${ch}`);
}

export function formatCallDuration(minutes: number): string {
  const totalSeconds = Math.max(0, Math.round(minutes * 60));
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export function formatDateTimeKeepOffset(input: string | Date): string {
  if (typeof input === 'string') {
    const match = input.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.\d+)?([+-]\d{2}:\d{2})$/);
    if (match) return `${match[1]}${match[2]}`;
  }
  return formatDateTime(input);
}
