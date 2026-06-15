import { defineErrorCatalog } from 'evlog'

// New server errors should be defined here using defineErrorCatalog so they carry
// structured why/fix context that flows into the per-request wide event automatically.
export const apiErrorCatalog = defineErrorCatalog('api', {
    INTERNAL: {
        status: 500,
        message: 'An unexpected internal error occurred',
        why: 'An unhandled condition was reached inside the API server',
        fix: 'Retry the request. If the problem persists, contact support.',
    },
})
