import { ErrorCode } from '@activepieces/core-utils';
import { t } from 'i18next';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import { api } from '@/lib/api';
import { mutationFeedback } from '@/lib/mutation-feedback';

function show<T extends FieldValues>({
  form,
  error,
  keyField,
}: {
  form: UseFormReturn<T>;
  error: unknown;
  keyField?: Path<T>;
}): void {
  mutationFeedback.markShown(error);
  if (isKeyConflict(error)) {
    const typedKey = keyField ? String(form.getValues(keyField) ?? '') : '';
    if (keyField && typedKey.trim() !== '') {
      form.setError(keyField, {
        type: 'manual',
        message: t(
          'Another policy already uses this embed key. Enter a different one.',
        ),
      });
      return;
    }
    form.setError('root.serverError', {
      type: 'manual',
      message: keyField
        ? t(
            'Another policy already uses the embed key made from this name. Pick a different name or enter an embed key.',
          )
        : t(
            'Another policy already uses the embed key made from this name. Pick a different name.',
          ),
    });
    return;
  }
  form.setError('root.serverError', {
    type: 'manual',
    message: mutationFeedback.message(error),
  });
}

function isKeyConflict(error: unknown): boolean {
  return (
    api.isApError(error, ErrorCode.VALIDATION) &&
    (api.serverErrorMessage(error) ?? '').toLowerCase().includes('key')
  );
}

export const pieceSetFormErrors = { show, isKeyConflict };
