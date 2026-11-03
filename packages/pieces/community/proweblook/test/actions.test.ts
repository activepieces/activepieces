import { HttpError } from '@activepieces/pieces-common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { proweblook } from '../src';
import { checkWhatsappAction } from '../src/lib/actions/check-whatsapp';
import { getBalanceAction } from '../src/lib/actions/get-balance';
import { validatePhoneAction } from '../src/lib/actions/validate-phone';
import { verifyEmailAction } from '../src/lib/actions/verify-email';
import { proweblookAuth } from '../src/lib/auth';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@activepieces/pieces-common')
  >();
  return {
    ...actual,
    httpClient: {
      sendRequest: (...args: unknown[]) => sendRequest(...args),
    },
  };
});

const AUTH = { type: 'SECRET_TEXT', secret_text: 'pwl_test_key' };

function okEnvelope(data: unknown) {
  return {
    status: 200,
    body: {
      ok: true,
      data,
    },
  };
}

beforeEach(() => {
  sendRequest.mockReset();
});

describe('ProWebLook piece metadata & auth', () => {
  it('registers all five actions including custom_api_call', () => {
    const metadata = proweblook.metadata();
    expect(Object.keys(metadata.actions)).toEqual([
      'verify_email',
      'validate_phone',
      'check_whatsapp',
      'get_balance',
      'custom_api_call',
    ]);
  });

  it('validates API key against get_balance', async () => {
    sendRequest.mockResolvedValueOnce(
      okEnvelope({
        account_email: 'user@example.com',
        email: { amount: 50, unlimited: false },
        phone: { amount: 50, unlimited: false },
        whatsapp: { amount: 50, unlimited: false },
      })
    );

    const result = await proweblookAuth.validate!({
      auth: '  pwl_test_key  ',
      server: {} as never,
    });

    expect(result).toEqual({ valid: true });
    expect(sendRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: 'https://proweblook.com/api/v1/zapier/get_balance',
      headers: {
        Authorization: 'Bearer pwl_test_key',
        'Content-Type': 'application/json',
      },
      body: {},
    });
  });

  it('returns invalid when API key is rejected with 401', async () => {
    sendRequest.mockRejectedValueOnce(
      new HttpError(
        {},
        {
          status: 401,
          responseBody: {
            ok: false,
            error: { code: 'invalid_api_key', message: 'Invalid API key' },
          },
        }
      )
    );

    const result = await proweblookAuth.validate!({
      auth: 'bad_key',
      server: {} as never,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/rejected this API key/i);
  });

  it('surfaces upstream error details when auth validation hits a non-401 error', async () => {
    sendRequest.mockRejectedValueOnce(
      new HttpError(
        {},
        {
          status: 503,
          responseBody: {
            ok: false,
            error: {
              code: 'service_unavailable',
              message: 'Service temporarily unavailable',
            },
          },
        }
      )
    );

    const result = await proweblookAuth.validate!({
      auth: 'pwl_test_key',
      server: {} as never,
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain(
      'Service temporarily unavailable (service_unavailable)'
    );
  });

  it('rejects blank API key without making a network request', async () => {
    const result = await proweblookAuth.validate!({
      auth: '   ',
      server: {} as never,
    });

    expect(result.valid).toBe(false);
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('Verify Email', () => {
  it('posts email and returns unwrapped verification data', async () => {
    sendRequest.mockResolvedValueOnce(
      okEnvelope({
        email: 'person@example.com',
        verdict: 'deliverable',
        reason: 'accepted_email',
        billing_status: 'charged',
      })
    );

    const result = await verifyEmailAction.run({
      auth: AUTH,
      propsValue: { email: '  person@example.com  ' },
    } as never);

    expect(sendRequest.mock.calls[0][0].url).toBe(
      'https://proweblook.com/api/v1/zapier/verify_email'
    );
    expect(sendRequest.mock.calls[0][0].body).toEqual({
      email: 'person@example.com',
    });
    expect(result).toEqual({
      email: 'person@example.com',
      verdict: 'deliverable',
      reason: 'accepted_email',
      billing_status: 'charged',
    });
  });

  it('rejects empty email locally', async () => {
    await expect(
      verifyEmailAction.run({
        auth: AUTH,
        propsValue: { email: '   ' },
      } as never)
    ).rejects.toThrow(/Email Address cannot be empty/);
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('Validate Phone Number', () => {
  it('omits country_code when blank', async () => {
    sendRequest.mockResolvedValueOnce(
      okEnvelope({
        verdict: 'valid',
        reason: 'valid_number',
        billing_status: 'upstream_managed',
        details: { line_type: 'mobile' },
      })
    );

    const result = await validatePhoneAction.run({
      auth: AUTH,
      propsValue: { phone_number: '+12025550123', country_code: '   ' },
    } as never);

    expect(sendRequest.mock.calls[0][0].body).toEqual({
      phone_number: '+12025550123',
    });
    expect(result).toMatchObject({ verdict: 'valid' });
  });

  it('uppercases 2-letter country_code when provided', async () => {
    sendRequest.mockResolvedValueOnce(
      okEnvelope({
        verdict: 'valid',
        reason: 'valid_number',
        billing_status: 'upstream_managed',
        details: {},
      })
    );

    await validatePhoneAction.run({
      auth: AUTH,
      propsValue: { phone_number: '2025550123', country_code: 'us' },
    } as never);

    expect(sendRequest.mock.calls[0][0].body).toEqual({
      phone_number: '2025550123',
      country_code: 'US',
    });
  });

  it('rejects invalid country_code format before calling API', async () => {
    await expect(
      validatePhoneAction.run({
        auth: AUTH,
        propsValue: { phone_number: '2025550123', country_code: 'USA' },
      } as never)
    ).rejects.toThrow(/2-letter ISO/);
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('Check WhatsApp Number', () => {
  it('requires E.164 format starting with +', async () => {
    await expect(
      checkWhatsappAction.run({
        auth: AUTH,
        propsValue: { phone_number: '12025550123' },
      } as never)
    ).rejects.toThrow(/E\.164 international format starting with \+/);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('checks E.164 number and returns WhatsApp registration verdict', async () => {
    sendRequest.mockResolvedValueOnce(
      okEnvelope({
        verdict: 'on_whatsapp',
        reason: 'registered',
        billing_status: 'upstream_managed',
        details: {},
      })
    );

    const result = await checkWhatsappAction.run({
      auth: AUTH,
      propsValue: { phone_number: '+12025550123' },
    } as never);

    expect(sendRequest.mock.calls[0][0].url).toBe(
      'https://proweblook.com/api/v1/zapier/check_whatsapp'
    );
    expect(result).toMatchObject({ verdict: 'on_whatsapp' });
  });
});

describe('Get Credit Balance & error surfacing', () => {
  it('returns credit pools for get_balance', async () => {
    const balance = {
      account_email: 'user@example.com',
      email: { amount: 50, unlimited: false },
      phone: { amount: 50, unlimited: false },
      whatsapp: { amount: 50, unlimited: false },
    };
    sendRequest.mockResolvedValueOnce(okEnvelope(balance));

    const result = await getBalanceAction.run({
      auth: AUTH,
      propsValue: {},
    } as never);

    expect(result).toEqual(balance);
  });

  it('surfaces clean error message on non-2xx API error', async () => {
    sendRequest.mockRejectedValueOnce(
      new HttpError(
        { email: 'person@example.com' },
        {
          status: 402,
          responseBody: {
            ok: false,
            error: {
              code: 'insufficient_credits',
              message: 'Insufficient email credits',
            },
          },
        }
      )
    );

    await expect(
      verifyEmailAction.run({
        auth: AUTH,
        propsValue: { email: 'person@example.com' },
      } as never)
    ).rejects.toThrow('Insufficient email credits (insufficient_credits)');
  });

  it('surfaces clean error message when 200 envelope has ok: false', async () => {
    sendRequest.mockResolvedValueOnce({
      status: 200,
      body: {
        ok: false,
        error: {
          code: 'rate_limited',
          message: 'Too many requests',
        },
      },
    });

    await expect(
      getBalanceAction.run({
        auth: AUTH,
        propsValue: {},
      } as never)
    ).rejects.toThrow('Too many requests (rate_limited)');
  });
});
