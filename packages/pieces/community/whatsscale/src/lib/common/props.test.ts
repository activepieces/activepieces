import { describe, it, expect, vi, beforeEach } from 'vitest';
import { whatsscaleProps } from './props';
import * as clientModule from './client';

vi.mock('./client', () => ({
  whatsscaleClient: vi.fn(),
}));

const mockAuth = { secret_text: 'test-api-key' };
const mockSession = 'test-session';

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Contact Dropdown ────────────────────────────────────────────────────────

describe('contact dropdown', () => {
  it('loads contacts for the selected session', async () => {
    const mockContacts = [
      { label: 'John (+31649931832)', value: '31649931832@c.us' },
    ];
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({
      body: mockContacts,
    } as any);

    const result = await (whatsscaleProps.contact as any).options({
      auth: mockAuth,
      session: mockSession,
    });

    expect(clientModule.whatsscaleClient).toHaveBeenCalledWith(
      'test-api-key',
      'GET',
      '/make/contacts',
      undefined,
      { session: mockSession },
    );
    expect(result.disabled).toBe(false);
    expect(result.options).toEqual(mockContacts);
  });

  it('returns disabled state when no auth', async () => {
    const result = await (whatsscaleProps.contact as any).options({
      auth: null,
      session: mockSession,
    });
    expect(result.disabled).toBe(true);
    expect(result.placeholder).toBe('Please connect your account');
  });

  it('returns disabled state when no session', async () => {
    const result = await (whatsscaleProps.contact as any).options({
      auth: mockAuth,
      session: null,
    });
    expect(result.disabled).toBe(true);
    expect(result.placeholder).toBe('Please select a session first');
  });
});

// ─── Group Dropdown ──────────────────────────────────────────────────────────

describe('group dropdown', () => {
  it('loads groups for the selected session', async () => {
    const mockGroups = [
      { label: 'My Group', value: '120363318673245672@g.us' },
    ];
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({
      body: mockGroups,
    } as any);

    const result = await (whatsscaleProps.group as any).options({
      auth: mockAuth,
      session: mockSession,
    });

    expect(clientModule.whatsscaleClient).toHaveBeenCalledWith(
      'test-api-key',
      'GET',
      '/make/groups',
      undefined,
      { session: mockSession },
    );
    expect(result.disabled).toBe(false);
    expect(result.options).toEqual(mockGroups);
  });

  it('returns disabled state when no auth', async () => {
    const result = await (whatsscaleProps.group as any).options({
      auth: null,
      session: mockSession,
    });
    expect(result.disabled).toBe(true);
    expect(result.placeholder).toBe('Please connect your account');
  });
});

// ─── Channel Dropdown ────────────────────────────────────────────────────────

describe('channel dropdown', () => {
  it('loads channels for the selected session', async () => {
    const mockChannels = [
      { label: 'My Channel', value: '120363318673245672@newsletter' },
    ];
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({
      body: mockChannels,
    } as any);

    const result = await (whatsscaleProps.channel as any).options({
      auth: mockAuth,
      session: mockSession,
    });

    expect(clientModule.whatsscaleClient).toHaveBeenCalledWith(
      'test-api-key',
      'GET',
      '/make/channels',
      undefined,
      { session: mockSession },
    );
    expect(result.disabled).toBe(false);
    expect(result.options).toEqual(mockChannels);
  });

  it('returns disabled state when no auth', async () => {
    const result = await (whatsscaleProps.channel as any).options({
      auth: null,
      session: mockSession,
    });
    expect(result.disabled).toBe(true);
    expect(result.placeholder).toBe('Please connect your account');
  });
});

// ─── CRM Contact Dropdown ────────────────────────────────────────────────────

describe('crmContact dropdown', () => {
  it('loads CRM contacts (no session dependency)', async () => {
    const mockCrmContacts = [
      {
        label: 'Jane Doe (+31649931832)',
        value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      },
    ];
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({
      body: mockCrmContacts,
    } as any);

    const result = await (whatsscaleProps.crmContact as any).options({
      auth: mockAuth,
    });

    expect(clientModule.whatsscaleClient).toHaveBeenCalledWith(
      'test-api-key',
      'GET',
      '/make/crm/contacts',
    );
    expect(result.disabled).toBe(false);
    expect(result.options).toEqual(mockCrmContacts);
  });

  it('returns disabled state when no auth', async () => {
    const result = await (whatsscaleProps.crmContact as any).options({
      auth: null,
    });
    expect(result.disabled).toBe(true);
    expect(result.placeholder).toBe('Please connect your account');
  });
});

// ─── CRM Tag Dropdown ────────────────────────────────────────────────────────

describe('crmTag dropdown', () => {
  it('loads CRM tags', async () => {
    const mockTags = [{ label: 'vip (5)', value: 'vip' }];
    vi.mocked(clientModule.whatsscaleClient).mockResolvedValueOnce({
      body: mockTags,
    } as any);

    const result = await (whatsscaleProps.crmTag as any).options({
      auth: mockAuth,
    });

    expect(clientModule.whatsscaleClient).toHaveBeenCalledWith(
      'test-api-key',
      'GET',
      '/make/crm/tags',
    );
    expect(result.disabled).toBe(false);
    expect(result.options).toEqual(mockTags);
  });

  it('returns disabled state when no auth', async () => {
    const result = await (whatsscaleProps.crmTag as any).options({
      auth: null,
    });
    expect(result.disabled).toBe(true);
    expect(result.placeholder).toBe('Please connect your account');
  });
});
