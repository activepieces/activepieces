import { isNil, Metadata, omit, spreadIfDefined } from '@activepieces/core-utils'

// accountIdentifier is always rewritten, never left untouched: an unresolved
// re-connect must clear a previously resolved account rather than keep labelling
// the connection with the account it no longer authenticates as. The key is also
// stripped from caller-supplied metadata so only the resolver can write it.
export const mergeConnectionMetadata = ({
    requestMetadata,
    existingMetadata,
    accountIdentifier,
}: {
    requestMetadata: Metadata | undefined
    existingMetadata: Metadata | undefined | null
    accountIdentifier: string | undefined
}): Metadata | undefined => {
    const baseMetadata = requestMetadata ?? existingMetadata
    if (isNil(baseMetadata) && isNil(accountIdentifier)) {
        return undefined
    }
    return {
        ...omit(baseMetadata ?? {}, ['accountIdentifier']),
        ...spreadIfDefined('accountIdentifier', accountIdentifier),
    }
}
