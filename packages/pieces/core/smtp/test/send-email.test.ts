import { describe, it, expect, vi } from 'vitest';
import { sendEmail } from '../src/lib/actions/send-email';
import { smtpCommon } from '../src/lib/common';

describe('sendEmail action', () => {
  it('should pass replyTo to mailOptions when provided', async () => {
    const sendMailMock = vi.fn().mockResolvedValue({ messageId: '123' });
    vi.spyOn(smtpCommon, 'createSMTPTransport').mockReturnValue({
      sendMail: sendMailMock,
    } as any);

    const context = {
      auth: {
        props: {
          host: 'smtp.example.com',
          port: 587,
          TLS: true,
        },
      },
      propsValue: {
        from: 'sender@example.com',
        to: ['recipient@example.com'],
        replyTo: 'reply-here@example.com',
        subject: 'Test Subject',
        body_type: 'plain_text',
        body: 'Hello World',
        attachments: [],
      },
    };

    await (sendEmail.run as any)(context);

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const mailOptions = sendMailMock.mock.calls[0][0];
    expect(mailOptions.replyTo).toBe('reply-here@example.com');
    expect(mailOptions.inReplyTo).toBeUndefined();
    expect(mailOptions.from).toBe('sender@example.com');
    expect(mailOptions.to).toBe('recipient@example.com');
    expect(mailOptions.subject).toBe('Test Subject');
    expect(mailOptions.text).toBe('Hello World');
  });

  it('should handle optional senderName and multiple recipients', async () => {
    const sendMailMock = vi.fn().mockResolvedValue({ messageId: '456' });
    vi.spyOn(smtpCommon, 'createSMTPTransport').mockReturnValue({
      sendMail: sendMailMock,
    } as any);

    const context = {
      auth: {
        props: {
          host: 'smtp.example.com',
          port: 465,
          TLS: false,
        },
      },
      propsValue: {
        from: 'sender@example.com',
        senderName: 'Support Team',
        to: ['a@example.com', 'b@example.com'],
        cc: ['c@example.com'],
        bcc: ['d@example.com'],
        replyTo: 'support@example.com',
        subject: 'Welcome',
        body_type: 'html',
        body: '<p>Welcome</p>',
        attachments: [],
      },
    };

    await (sendEmail.run as any)(context);

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const mailOptions = sendMailMock.mock.calls[0][0];
    expect(mailOptions.from).toBe('"Support Team" <sender@example.com>');
    expect(mailOptions.to).toBe('a@example.com,b@example.com');
    expect(mailOptions.cc).toBe('c@example.com');
    expect(mailOptions.bcc).toBe('d@example.com');
    expect(mailOptions.replyTo).toBe('support@example.com');
    expect(mailOptions.html).toBe('<p>Welcome</p>');
    expect(mailOptions.text).toBeUndefined();
  });
});
