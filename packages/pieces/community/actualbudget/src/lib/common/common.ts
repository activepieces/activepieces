import { DropdownOption } from '@activepieces/pieces-framework';
import os from 'os';

export async function initializeAndDownloadBudget(api: any, auth: any): Promise<void> {
    await api.init({
      // Budget data will be cached locally here, in subdirectories for each file.
      dataDir: os.tmpdir(),
      serverURL: auth.server_url,
      password: auth.password,
    });
  
    await api.downloadBudget(auth.sync_id, { password: auth.encryption_password ?? undefined });
}

export function getYears(): DropdownOption<string>[] {
  const dropDownOptions: DropdownOption<string>[] = [];

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const startYear = currentYear-10;

  for (let year = startYear; year <= currentYear + 5; year++) {
    dropDownOptions.push({ label: year.toString(), value: year.toString() });
  }
  
  return dropDownOptions;
}

export function getMonths(): DropdownOption<string>[] {
  return [
    {
      label: 'January',
      value: '01'
    },
    {
      label: 'February',
      value: '02'
    },
    {
      label: 'March',
      value: '03'
    },
    {
      label: 'April',
      value: '04'
    },
    {
      label: 'May',
      value: '05'
    },
    {
      label: 'June',
      value: '06'
    },
    {
      label: 'July',
      value: '07'
    },
    {
      label: 'August',
      value: '08'
    },
    {
      label: 'September',
      value: '09'
    },
    {
      label: 'October',
      value: '10'
    },
    {
      label: 'November',
      value: '11'
    },
    {
      label: 'December',
      value: '12'
    }
  ]
}