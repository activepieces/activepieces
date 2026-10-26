// formErrors values are translation keys, but they reach the UI as Zod messages, not as t('...') calls.
// i18n:extract (packages/web/i18next-parser.config.js) treats translationKey('...') like t('...'),
// so it adds every key here to translation.json instead of deleting it. Keep each value wrapped.
function translationKey<K extends string>(key: K): K {
    return key
}

export const formErrors = {
    required: translationKey('required'),
    invalidGitRepoSlug: translationKey('invalidGitRepoSlug'),
    invalidGitRepoBranch: translationKey('invalidGitRepoBranch'),
    invalidGitRepoRemoteUrl: translationKey('invalidGitRepoRemoteUrl'),
    invalidExternalId: translationKey('invalidExternalId'),
    invalidFileName: translationKey('invalidFileName'),
    messageRequiresContentOrFiles: translationKey('messageRequiresContentOrFiles'),
    agentConfigTooLarge: translationKey('agentConfigTooLarge'),
    invalidGcpResourceId: translationKey('invalidGcpResourceId'),
    duplicateRouteName: translationKey('duplicateRouteName'),
    atLeastOne: translationKey('atLeastOne'),
    wholeNumber: translationKey('wholeNumber'),
    atMostTenThousand: translationKey('atMostTenThousand'),
    tierNameTooLong: translationKey('tierNameTooLong'),
    tierDescriptionTooLong: translationKey('tierDescriptionTooLong'),
    invalidEmoji: translationKey('invalidEmoji'),
    tierTooManyModels: translationKey('tierTooManyModels'),
    tierDuplicateModel: translationKey('tierDuplicateModel'),
    tierThinkingBudgetInvalid: translationKey('tierThinkingBudgetInvalid'),
    invalidHeaderName: translationKey('invalidHeaderName'),
    reservedHeaderName: translationKey('reservedHeaderName'),
    duplicateHeaderName: translationKey('duplicateHeaderName'),
    invalidHeaderValue: translationKey('invalidHeaderValue'),
    invalidDomain: translationKey('invalidDomain'),
    duplicateDomain: translationKey('duplicateDomain'),
} as const

export const SAFE_EXTERNAL_ID_PATTERN = /^(?!\.{1,2}$)[A-Za-z0-9._-]{1,128}$/
