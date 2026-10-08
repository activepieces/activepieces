import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The Users field must be a STATIC multi-select whose options are fetched inside
 * the DynamicProperties `props` function.
 *
 * A `Property.MultiSelectDropdown` with its own `options()` cannot be nested
 * inside a DYNAMIC prop: the builder renders the child without
 * `dynamicPropsInfo` and shows "Error: dynamicPropsInfo is required", and the
 * engine's `getPropOrThrow` does a flat `props[propertyName]` lookup so the
 * nested `options()` is never executed. Same-message mode was unusable in the
 * builder while every static check stayed green, which is what these tests are
 * here to stop happening again.
 */

const getUsers = vi.fn();

vi.mock('../src/lib/common/props', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../src/lib/common/props')>();
    return { ...actual, getUsers: (token: string) => getUsers(token) };
});

vi.mock('../src/lib/common/auth-helpers', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../src/lib/common/auth-helpers')>();
    return { ...actual, getBotToken: () => 'xoxb-test' };
});

type DynamicProp = {
    props: (propsValue: Record<string, unknown>) => Promise<Record<string, {
        type: string;
        required: boolean;
        options?: { disabled: boolean; placeholder?: string; options: { label: string; value: string }[] };
    }>>;
};

async function recipientProps(propsValue: Record<string, unknown>) {
    const { slackSendMessageToMultipleUsersAction } = await import(
        '../src/lib/actions/send-message-to-multiple-users'
    );
    const recipients = slackSendMessageToMultipleUsersAction.props[
        'recipients'
    ] as unknown as DynamicProp;
    return recipients.props(propsValue);
}

const AUTH = { access_token: 'xoxb-test' };

beforeEach(() => {
    getUsers.mockReset();
});

describe('recipients — same-message mode', () => {
    it('renders Users as a static multi-select, never a nested dynamic dropdown', async () => {
        getUsers.mockResolvedValueOnce([
            { label: 'ada', value: 'U111' },
            { label: 'grace', value: 'U222' },
        ]);

        const props = await recipientProps({ mode: 'same_message', auth: AUTH });

        expect(props['userIds'].type).toBe('STATIC_MULTI_SELECT_DROPDOWN');
        expect(props['userIds'].type).not.toBe('MULTI_SELECT_DROPDOWN');
    });

    it('embeds the fetched members as options', async () => {
        getUsers.mockResolvedValueOnce([
            { label: 'ada', value: 'U111' },
            { label: 'grace', value: 'U222' },
        ]);

        const props = await recipientProps({ mode: 'same_message', auth: AUTH });

        expect(props['userIds'].options?.options).toEqual([
            { label: 'ada', value: 'U111' },
            { label: 'grace', value: 'U222' },
        ]);
        expect(props['userIds'].options?.disabled).toBe(false);
    });

    it('is required, so an empty selection cannot reach the send plan', async () => {
        getUsers.mockResolvedValueOnce([{ label: 'ada', value: 'U111' }]);

        const props = await recipientProps({ mode: 'same_message', auth: AUTH });

        expect(props['userIds'].required).toBe(true);
    });

    it('does not call Slack when no connection is chosen, and says so', async () => {
        const props = await recipientProps({ mode: 'same_message', auth: undefined });

        expect(getUsers).not.toHaveBeenCalled();
        expect(props['userIds'].options?.disabled).toBe(true);
        expect(props['userIds'].options?.placeholder).toBe('Connect Slack first');
    });

    it('disables the field when the workspace returns no members', async () => {
        getUsers.mockResolvedValueOnce([]);

        const props = await recipientProps({ mode: 'same_message', auth: AUTH });

        expect(props['userIds'].options?.disabled).toBe(true);
        expect(props['userIds'].options?.options).toEqual([]);
    });

    it('still offers the shared Message field', async () => {
        getUsers.mockResolvedValueOnce([{ label: 'ada', value: 'U111' }]);

        const props = await recipientProps({ mode: 'same_message', auth: AUTH });

        expect(Object.keys(props)).toEqual(['userIds', 'text']);
        expect(props['text'].type).toBe('LONG_TEXT');
    });
});

describe('recipients — personal-message mode', () => {
    it('swaps in the per-user array and never fetches members', async () => {
        const props = await recipientProps({ mode: 'personal_message', auth: AUTH });

        expect(Object.keys(props)).toEqual(['personalMessages']);
        expect(props['personalMessages'].type).toBe('ARRAY');
        expect(getUsers).not.toHaveBeenCalled();
    });
});
