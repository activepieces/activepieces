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