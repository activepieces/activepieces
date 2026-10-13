import { ErrorCode } from '@activepieces/core-utils';
import { t } from 'i18next';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import { pieceSetTerms } from '@/features/piece-sets';
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
  if (!isKeyConflict(error)) {
    form.setError('root.serverError', {
      type: 'manual',
      message: mutationFeedback.message(error),
    });
    return;
  }
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
}

function isKeyConflict(error: unknown): boolean {
  return (
    api.isApError(error, ErrorCode.VALIDATION) &&
    api.serverErrorMessage(error) === KEY_CONFLICT_MESSAGE
  );
}

const KEY_CONFLICT_MESSAGE = 'Piece set key already used';

export const pieceSetFormErrors = { show };
