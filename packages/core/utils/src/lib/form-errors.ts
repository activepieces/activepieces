export const formErrors = {
    required: 'required',
    invalidGitRepoSlug: 'invalidGitRepoSlug',
    invalidGitRepoBranch: 'invalidGitRepoBranch',
    invalidGitRepoRemoteUrl: 'invalidGitRepoRemoteUrl',
    invalidExternalId: 'invalidExternalId',
    invalidFileName: 'invalidFileName',
    messageRequiresContentOrFiles: 'messageRequiresContentOrFiles',
} as const

export const SAFE_EXTERNAL_ID_PATTERN = /^(?!\.{1,2}$)[A-Za-z0-9._-]{1,128}$/
