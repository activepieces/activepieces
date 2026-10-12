// The i18n:extract script only keeps translation keys that it finds in a t('...') call in packages/web/src.
// formErrors keys reach the UI as Zod messages, not as t('...') calls, so the script deletes them from translation.json.
// This file lists every formErrors key in a t('...') call to keep them. When you add a key to formErrors, add it here too.
import { formErrors } from '@activepieces/shared';
import { t } from 'i18next';

function translateAll(): Record<FormErrorKey, string> {
  return {
    required: t('required'),
    invalidGitRepoSlug: t('invalidGitRepoSlug'),
    invalidGitRepoBranch: t('invalidGitRepoBranch'),
    invalidGitRepoRemoteUrl: t('invalidGitRepoRemoteUrl'),
    invalidExternalId: t('invalidExternalId'),
    invalidFileName: t('invalidFileName'),
    messageRequiresContentOrFiles: t('messageRequiresContentOrFiles'),
    agentConfigTooLarge: t('agentConfigTooLarge'),
    invalidGcpResourceId: t('invalidGcpResourceId'),
    duplicateRouteName: t('duplicateRouteName'),
    atLeastOne: t('atLeastOne'),
    wholeNumber: t('wholeNumber'),
    atMostTenThousand: t('atMostTenThousand'),
    tierNameTooLong: t('tierNameTooLong'),
    tierDescriptionTooLong: t('tierDescriptionTooLong'),
    invalidEmoji: t('invalidEmoji'),
    tierTooManyModels: t('tierTooManyModels'),
    tierDuplicateModel: t('tierDuplicateModel'),
    tierThinkingBudgetInvalid: t('tierThinkingBudgetInvalid'),
    invalidHeaderName: t('invalidHeaderName'),
    reservedHeaderName: t('reservedHeaderName'),
    duplicateHeaderName: t('duplicateHeaderName'),
    invalidHeaderValue: t('invalidHeaderValue'),
  };
}

export const formErrorTranslations = { translateAll };

type FormErrorKey = keyof typeof formErrors;
