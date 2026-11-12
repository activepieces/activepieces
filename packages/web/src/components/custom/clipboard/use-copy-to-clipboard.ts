import { tryCatch } from '@activepieces/core-utils';
import { t } from 'i18next';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

export function useCopyToClipboard() {
  const [isCopied, setIsCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const copy = async (params: CopyParams) => {
    if (!(await writeToClipboard(params))) {
      return;
    }
    setIsCopied(true);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setIsCopied(false), COPIED_RESET_MS);
  };

  return { isCopied, copy };
}

export const clipboardUtils = { copy: copyWithToast };

async function copyWithToast(params: CopyParams): Promise<void> {
  if (await writeToClipboard(params)) {
    toast.success(t('Copied to clipboard'));
  }
}

async function writeToClipboard({ value }: CopyParams): Promise<boolean> {
  const text =
    typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  const { error } = await tryCatch(() => navigator.clipboard.writeText(text));
  if (error) {
    console.error('Failed to copy to clipboard', error);
    toast.error(t('Failed to copy to clipboard'));
    return false;
  }
  return true;
}

const COPIED_RESET_MS = 3000;

export type CopyParams = {
  value: unknown;
};
