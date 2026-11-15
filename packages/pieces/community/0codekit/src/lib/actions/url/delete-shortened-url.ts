import { createAction } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { zeroCodeKitUrl } from '../../common/url';
import { zeroCodeKitCodeUrlOutputSchemas } from '../../common/output-schemas/code-url';

export const deleteShortenedUrlAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'delete_shortened_url',
    classification: 'DESTRUCTIVE',
    displayName: 'Delete Shortened Url',
    description: 'Permanently remove a short link so it stops redirecting.',
    audience: 'both',
    aiMetadata: {
        description:
            'Permanently delete a shortened URL, identified by its identifier, from the connected 0CodeKit account. The short link stops redirecting and cannot be recovered. Only links created with this account can be deleted. Fails if the link no longer exists.',
        idempotent: false,
    },
    props: {
        identifier: zeroCodeKitUrl.shortenedUrlIdentifier({
            description: 'The short link to delete.',
        }),
    },
    outputSchema: zeroCodeKitCodeUrlOutputSchemas.deleteShortenedUrl,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<DeleteShortenedUrlResponse>({
            apiKey: auth.secret_text,
            path: '/generate/shortenedurl/del',
            body: {
                identifier: propsValue.identifier,
            },
        });
        return {
            deleted: true,
            identifier: propsValue.identifier,
            short_url: zeroCodeKitUrl.shortUrlOf(propsValue.identifier),
            message: response.message ?? null,
        };
    },
});

type DeleteShortenedUrlResponse = {
    message?: string;
};
