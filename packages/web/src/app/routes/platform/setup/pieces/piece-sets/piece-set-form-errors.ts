import { ErrorCode } from '@activepieces/core-utils';
import { t } from 'i18next';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import { pieceSetTerms } from '@/features/piece-sets';
import { api } from '@/lib/api';

function show<T extends FieldValues>({
  form,
  error,
  keyField,
  showKey,
}: {
  form: UseFormReturn<T>;
  error: unknown;
  keyField?: Path<T>;
  showKey: boolean;
}): void {
  if (isKeyConflict(error) && !showKey) {
    form.setError('root.serverError', {
      type: 'manual',
      message: t(
        'Another {term} already uses this name. Pick a different name.',
        pieceSetTerms.get(),
      ),
    });
    return;
  }
  if (isKeyConflict(error)) {
    const typedKey = keyField ? String(form.getValues(keyField) ?? '') : '';
    if (keyField && typedKey.trim() !== '') {
      form.setError(keyField, {
        type: 'manual',
        message: t(
          'Another {term} already uses this embed key. Enter a different one.',
          pieceSetTerms.get(),
        ),
      });
      return;
    }
    form.setError('root.serverError', {
      type: 'manual',
      message: keyField
        ? t(
            'Another {term} already uses the embed key made from this name. Pick a different name or enter an embed key.',
            pieceSetTerms.get(),
          )
        : t(
            'Another {term} already uses the embed key made from this name. Pick a different name.',
            pieceSetTerms.get(),
          ),
    });
    return;
  }
  form.setError('root.serverError', {
    type: 'manual',
    message: api.extractServerErrorMessage(
      error,
      t('Something went wrong. Please try again.'),
    ),
  });
}

function isKeyConflict(error: unknown): boolean {
  return (
    api.isApError(error, ErrorCode.VALIDATION) &&
    (api.serverErrorMessage(error) ?? '').toLowerCase().includes('key')
  );
}

export const pieceSetFormErrors = { show };
