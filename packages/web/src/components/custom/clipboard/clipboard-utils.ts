import { tryCatch } from '@activepieces/core-utils';
import { t } from 'i18next';
import { toast } from 'sonner';

async function copy(text: string): Promise<boolean> {
  const { error } = await tryCatch(() => navigator.clipboard.writeText(text));
  if (error) {
    toast.error(t('Failed to copy to clipboard'), { duration: 3000 });
    return false;
  }
  return true;
}

export const clipboardUtils = { copy };
