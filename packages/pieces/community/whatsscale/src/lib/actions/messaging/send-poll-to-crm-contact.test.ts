import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendPollToCrmContactAction } from './send-poll-to-crm-contact';
import { whatsscaleClient } from '../../common/client';
import { buildRecipientBody, RecipientType } from '../../common/recipients';

vi.mock('../../common/client');
vi.mock('../../common/recipients');

describe('sendPollToCrmContactAction', () => {
  const mockClient = vi.mocked(whatsscaleClient);
  const mockBuildBody = vi.mocked(buildRecipientBody);

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.mockResolvedValue({ body: { success: true } } as any);
    mockBuildBody.mockReturnValue({
      session: 'user_test',
      contact_type: 'crm_contact',
      crm_contact_id: 'uuid-123',
    } as any);
  });

  it('sends poll to CRM contact with options', async () => {
    await sendPollToCrmContactAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        crmContact: 'uuid-123',
        question: 'Interested in upgrade?',
        options: ['Yes', 'No', 'Maybe'],
        multipleAnswers: false,
      } as any,
    } as any);

    expect(mockClient).toHaveBeenCalledWith(
      'ws_key',
      expect.anything(),
      '/api/sendPoll',
      {
        session: 'user_test',
        contact_type: 'crm_contact',
        crm_contact_id: 'uuid-123',
        question: 'Interested in upgrade?',
        options: ['Yes', 'No', 'Maybe'],
        multipleAnswers: false,
        platform: 'activepieces',
      },
    );
  });

  it('throws if fewer than 2 options provided', async () => {
    await expect(
      sendPollToCrmContactAction.run({
        auth: { secret_text: 'ws_key' } as any,
        propsValue: {
          session: 'user_test',
          crmContact: 'uuid-123',
          question: 'Pick one',
          options: ['OnlyOne'],
        } as any,
      } as any),
    ).rejects.toThrow('Poll requires at least 2 options');
  });

  it('uses CRM_CONTACT recipient type', async () => {
    await sendPollToCrmContactAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        crmContact: 'uuid-123',
        question: 'Pick one',
        options: ['Yes', 'No'],
      } as any,
    } as any);

    expect(mockBuildBody).toHaveBeenCalledWith(
      RecipientType.CRM_CONTACT,
      'user_test',
      'uuid-123',
    );
  });

  it('calls correct endpoint', async () => {
    await sendPollToCrmContactAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        crmContact: 'uuid-123',
        question: 'Pick one',
        options: ['Yes', 'No'],
      } as any,
    } as any);

    expect(mockClient).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      '/api/sendPoll',
      expect.anything(),
    );
  });

  it('returns response body', async () => {
    const result = await sendPollToCrmContactAction.run({
      auth: { secret_text: 'ws_key' } as any,
      propsValue: {
        session: 'user_test',
        crmContact: 'uuid-123',
        question: 'Pick one',
        options: ['Yes', 'No'],
      } as any,
    } as any);

    expect(result).toEqual({ success: true });
  });
});
