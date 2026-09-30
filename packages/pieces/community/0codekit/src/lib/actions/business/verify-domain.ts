import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { businessAiOutputSchemas } from '../../common/output-schemas/business-ai';

export const verifyDomainAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'verify_domain',
    classification: 'READ',
    displayName: 'Verify a Domain',
    description: 'Check whether a domain or website is reachable and get its main domain.',
    audience: 'both',
    aiMetadata: {
        description:
            'Check whether a domain or website URL is valid by requesting it, and return the main domain without subdomains. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        domain: Property.ShortText({
            displayName: 'Domain',
            description: 'The domain or website to check, for example `https://www.example.com`.',
            required: true,
            placeholder: 'https://www.example.com',
        }),
    },
    outputSchema: businessAiOutputSchemas.verifyDomain,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<VerifyDomainResponse>({
            apiKey: auth.secret_text,
            path: '/business/verify/domain',
            body: { domain: propsValue.domain.trim() },
        });
        return {
            is_valid: response.isValid ?? null,
            main_domain: response.mainDomain ?? null,
        };
    },
});

type VerifyDomainResponse = {
    mainDomain?: string;
    isValid?: boolean;
};
