import { createAction, IAction, InputPropertyMap } from '@activepieces/pieces-framework';
import { jsmOpsAuth } from '../auth';
import { jsmOps } from '../common/client';
import { JsmAuthValue } from '../common/types';

export const jsmCustomApiCall = {
    baseUrl,
    authMapping,
    withCloudId,
};

function baseUrl(auth: JsmAuthValue | undefined): string {
    if (auth === undefined) {
        return '';
    }
    if (jsmOps.isKeyConnection(auth)) {
        return jsmOps.keyBaseUrl(jsmOps.keyProps(auth));
    }
    const cloudId = auth.props.cloudId?.trim() ?? '';
    return jsmOps.accountBaseUrl(cloudId.length > 0 ? cloudId : '{cloudId}');
}

async function authMapping(auth: JsmAuthValue): Promise<Record<string, string>> {
    return jsmOps.authHeaders(auth);
}

function withCloudId<Props extends InputPropertyMap>(base: IAction<typeof jsmOpsAuth, Props>) {
    return createAction({
        auth: jsmOpsAuth,
        name: 'custom_api_call',
        classification: 'WRITE',
        displayName: base.displayName,
        description: 'Call any JSM Operations endpoint with this connection.',
        audience: 'human',
        aiMetadata: {
            description:
                'Sends a raw HTTP request to the JSM Operations API with the connection credentials: /jsm/ops/api/{cloudId}/v1 for account connections, the /v2 alert API for API keys. Use only when no dedicated action fits. Whether a retry is safe depends on the method and endpoint.',
            idempotent: false,
        },
        props: base.props,
        errorHandlingOptions: base.errorHandlingOptions,
        async run(context) {
            const auth = context.auth;
            const url = readUrl(context.propsValue);
            if (jsmOps.isKeyConnection(auth)) {
                assertOnConnectionHost({ url, base: baseUrl(auth) });
                return base.run({ ...context, auth });
            }
            const props = await jsmOps.fillCloudId(auth.props);
            const filled = { ...auth, props };
            assertOnConnectionHost({ url, base: baseUrl(filled) });
            return base.run({ ...context, auth: filled });
        },
    });
}

function readUrl(propsValue: unknown): string {
    if (typeof propsValue !== 'object' || propsValue === null || !('url' in propsValue)) {
        return '';
    }
    const field = propsValue.url;
    if (typeof field !== 'object' || field === null || !('url' in field)) {
        return '';
    }
    return typeof field.url === 'string' ? field.url.trim() : '';
}

function assertOnConnectionHost({ url, base }: { url: string; base: string }): void {
    if (!/^[a-z][a-z0-9+.-]*:/i.test(url) && !url.startsWith('//')) {
        return;
    }
    const allowed = new URL(base);
    const allowedPath = allowed.pathname.replace(/\/+$/, '');
    let target: URL;
    try {
        target = new URL(url);
    } catch {
        throw new Error(`"${url}" is not a valid URL. Use a path such as /alerts, or a full URL under ${base}.`);
    }
    const onBase = target.origin === allowed.origin && (target.pathname === allowedPath || target.pathname.startsWith(`${allowedPath}/`));
    if (!onBase || target.username !== '' || target.password !== '') {
        throw new Error(`Custom API Call only sends this connection's credentials to ${base}. Use a path such as /alerts, or a full URL under that address.`);
    }
}
