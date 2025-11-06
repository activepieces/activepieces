import { createAction } from '@activepieces/pieces-framework';
import { HttpError, HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { hunterApiCall } from '../common';
import { hunterAuth } from '../../index';
import { emailProp } from '../common/props';

export const verifyEmailAction = createAction({
    auth: hunterAuth,
    name: 'verify-email',
    displayName: 'Verify Email',
    description: 'Check email deliverability and validation status.',
    props: {
        email: emailProp,
    },
    async run(context) {
        const { email } = context.propsValue;

        const qparams: QueryParams = { email };

        let respBody: any;
        try {
            respBody = await hunterApiCall({
                apiKey: context.auth,
                endpoint: '/email-verifier',
                method: HttpMethod.GET,
                qparams,
            });
        } catch (err) {
            const httpErr = err as HttpError;
            const status = httpErr.response?.status;
            const errId = (httpErr.response?.body as any)?.errors?.[0]?.id;

            if (status === 202) {
                return { status: 'in_progress' as const };
            }
            if (status === 222) {
                throw new Error(
                    'Verification failed due to an unexpected SMTP server error. Please try again later.'
                );
            }
            if (status === 400) {
                switch (errId) {
                    case 'wrong_params':
                        throw new Error('Missing required parameter: email.');
                    case 'invalid_email':
                        throw new Error('The supplied email is invalid.');
                }
            }
            if (status === 429) {
                throw new Error(
                    'Rate limit exceeded (10 requests/sec, 300 req/min). Please wait and retry shortly.'
                );
            }
            if (status === 451 && errId === 'claimed_email') {
                throw new Error(
                    'Cannot verify: the email owner requested no processing of their data.'
                );
            }
            const detail = (httpErr.response?.body as any)?.errors?.[0]?.details ?? '';
            throw new Error(`Hunter Email Verifier error: ${detail} (status ${status}).`);
        }

        const data = respBody.data;
        if (!data) {
            return { status: 'in_progress' as const };
        }

        return {
            status: data.status,
            result: data.result,
            score: data.score,
            email: data.email,
            regexp: data.regexp,
            gibberish: data.gibberish,
            disposable: data.disposable,
            webmail: data.webmail,
            mx_records: data.mx_records,
            smtp_server: data.smtp_server,
            smtp_check: data.smtp_check,
            accept_all: data.accept_all,
            block: data.block,
            sources: data.sources,
        };
    },
});
