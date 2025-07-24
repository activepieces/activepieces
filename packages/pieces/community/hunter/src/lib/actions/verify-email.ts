import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { hunterApiCall } from '../common';
import { hunterAuth } from '../../index';
import { emailProp } from '../common/props';

export const verifyEmailAction = createAction({
    auth: hunterAuth,
    name: 'verify-email',
    displayName: 'Verify Email',
    description: `
    Checks deliverability and validation status of an email address.
    
    • Returns HTTP 200 with a detailed verification object when complete.  
    • If Hunter needs more time (up to 20s), it returns HTTP 202 "in progress"; you can call again later.  
    • Possible detailed \`status\`: "valid", "invalid", "accept_all", "webmail", "disposable", "unknown".  
    • Deprecated \`result\`: "deliverable", "undeliverable", "risky" (prefer using \`status\`).  
    • Throws documented errors:  
      - 400 wrong_params / invalid_email  
      - 222 SMTP failure (retry later)  
      - 451 claimed_email (cannot process)  
  `,
    props: {
        email: emailProp,
    },
    async run(context) {
        const { email } = context.propsValue;

        const qparams: QueryParams = { email };

        const resp = await hunterApiCall({
            apiKey: context.auth,
            endpoint: '/email-verifier',
            method: HttpMethod.GET,
            qparams,
        });

        // If Hunter returned 202 (in-progress), httpClient may not throw.
        // We assume resp as any and inspect for an 'data' field.
        // On 202, resp.data may be empty — so users should re-run the action until they get full details.
        const data = (resp as any).data;
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
            verification: data.verification,
        };
    },
});
