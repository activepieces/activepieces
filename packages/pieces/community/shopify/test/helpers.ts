import { HttpRequest, HttpResponse, httpClient } from '@activepieces/pieces-common';
import {
    ActionContext,
    AppConnectionType,
    createMockActionContext,
    InputPropertyMap,
    StaticPropsValue,
} from '@activepieces/pieces-framework';
import { vi } from 'vitest';
import { ShopifyAuth, shopifyAuth } from '../src/lib/common/auth';

export const TEST_AUTH: ShopifyAuth = {
    type: AppConnectionType.CUSTOM_AUTH,
    props: { shopName: 'test-shop', adminToken: 'shpat_test' },
};

export const GRAPHQL_URL = 'https://test-shop.myshopify.com/admin/api/2026-10/graphql.json';

export function mockShopify({ replies }: { replies: GraphqlBody[] }): SentGraphqlRequest[] {
    const sent: SentGraphqlRequest[] = [];
    const queue = [...replies];
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest): Promise<HttpResponse> => {
        const query = readField({ value: request.body, key: 'query' });
        const variables = readField({ value: request.body, key: 'variables' });
        sent.push({
            request,
            query: typeof query === 'string' ? query : '',
            variables: isRecord(variables) ? variables : {},
        });
        const reply = queue.shift();
        if (!reply) {
            throw new Error(`unexpected request: ${String(query).slice(0, 80)}`);
        }
        return { status: 200, headers: {}, body: reply };
    });
    return sent;
}

export function runAction({ action, propsValue }: RunActionParams): Promise<unknown> {
    const context: ShopifyActionContext = {
        ...createMockActionContext<InputPropertyMap>({ propsValue }),
        auth: TEST_AUTH,
    };
    return action.run(context);
}

function readField({ value, key }: { value: unknown; key: string }): unknown {
    return isRecord(value) ? value[key] : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

type ShopifyActionContext =ActionContext<typeof shopifyAuth, InputPropertyMap>;

export type TestAction = {
    run(context: ShopifyActionContext): Promise<unknown>;
};

type RunActionParams = {
    action: TestAction;
    propsValue: StaticPropsValue<InputPropertyMap>;
};

export type GraphqlBody = {
    data?: Record<string, unknown> | null;
    errors?: Record<string, unknown>[];
    extensions?: Record<string, unknown>;
};

export type SentGraphqlRequest = {
    request: HttpRequest;
    query: string;
    variables: Record<string, unknown>;
};
