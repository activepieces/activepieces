import { AppConnectionType, createMockActionContext } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chatWithCopilot } from '../src/lib/actions/chat-with-copilot';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
    return {
        ...actual,
        httpClient: {
            sendRequest: (...args: unknown[]) => sendRequest(...args),
        },
    };
});

beforeEach(() => {
    sendRequest.mockReset();
});

describe('Chat with Copilot', () => {
    it.each([
        ['a single-line reply', 'HELLO'],
        ['a multi-line reply', '{\n  "status": "ok"\n}\n'],
    ])('returns %s that Microsoft duplicated only once', async (_, answer) => {
        const reply = await chat({ text: answer + answer });
        expect(reply.text).toBe(answer);
    });

    it('keeps the other reply fields', async () => {
        const reply = await chat({ text: 'HELLOHELLO' });
        expect(reply).toEqual(responseMessage('HELLO'));
    });

    it.each([
        ['a normal reply', 'Hello! What can I help you with today?'],
        ['an odd-length reply', 'HELLOXHELLO'],
        ['an almost-repeated reply', 'HELLOHELLP'],
        ['an empty reply', ''],
    ])('leaves %s unchanged', async (_, text) => {
        const reply = await chat({ text });
        expect(reply.text).toBe(text);
    });

    it('returns a reply without text as Microsoft sent it', async () => {
        const message = { id: 'reply-1', adaptiveCards: [{ type: 'AdaptiveCard' }] };
        sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: { messages: [{ id: 'prompt' }, message] } });
        const reply = await Reflect.apply(chatWithCopilot.run, chatWithCopilot, [chatContext()]);
        expect(reply).toEqual(message);
    });
});

async function chat({ text }: { text: string }) {
    sendRequest.mockResolvedValueOnce({
        status: 200,
        headers: {},
        body: { messages: [{ id: 'prompt', text: 'Reply with exactly: HELLO' }, responseMessage(text)] },
    });
    return Reflect.apply(chatWithCopilot.run, chatWithCopilot, [chatContext()]);
}

function chatContext() {
    return {
        ...createMockActionContext({ propsValue: {} }),
        propsValue: { conversationId: 'conv-1', messageText: 'Reply with exactly: HELLO', timeZone: 'UTC', enableWebSearch: true },
        auth: oauthAuth(),
    };
}

function responseMessage(text: string) {
    return {
        '@odata.type': '#microsoft.graph.copilotConversationResponseMessage',
        id: 'reply-1',
        text,
        createdDateTime: '2026-10-25T14:26:28.1611712Z',
        adaptiveCards: [],
        attributions: [],
    };
}

function oauthAuth() {
    return {
        type: AppConnectionType.OAUTH2 as const,
        access_token: 'token',
        client_id: 'client',
        client_secret: 'secret',
        redirect_url: 'https://example.com/redirect',
        token_type: 'Bearer',
        claimed_at: 0,
        refresh_token: 'refresh',
        scope: 'offline_access',
        token_url: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        data: {},
        props: {},
    };
}
