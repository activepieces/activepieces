import { describe, expect, it, vi, beforeEach } from 'vitest';
import { httpClient, HttpError } from '@activepieces/pieces-common';
import { createMockActionContext } from '@activepieces/pieces-framework';
import { getGenderByFirstName } from '../src/lib/actions/get-gender-by-first-name';
import { getGenderByFullName } from '../src/lib/actions/get-gender-by-full-name';
import { getGenderByEmail } from '../src/lib/actions/get-gender-by-email';
import { getCountryOfOrigin } from '../src/lib/actions/get-country-of-origin';
import { getStatistics } from '../src/lib/actions/get-statistics';
import { genderApiAuth } from '../src/lib/common/auth';

const auth = { type: 'SECRET_TEXT', secret_text: 'key-123' };
const validationServer = { apiUrl: '', publicUrl: '', mintOidcToken: async () => '' };

function ctx(propsValue: Record<string, unknown>) {
  return { ...createMockActionContext({ propsValue }), auth };
}

function ok(body: unknown) {
  return { status: 200, headers: {}, body };
}

const genderBody = {
  input: { first_name: 'Andrea', country: 'IT' },
  details: { credits_used: 1, samples: 3000, country: 'IT', first_name_sanitized: 'andrea', duration: '20ms' },
  result_found: true,
  first_name: 'Andrea',
  probability: 0.97,
  gender: 'male',
};

describe('gender-api', () => {
  const send = vi.spyOn(httpClient, 'sendRequest');
  beforeEach(() => {
    send.mockReset();
    send.mockRejectedValue(new Error('unexpected request'));
  });

  it('sends country_code prop as country and normalizes output', async () => {
    send.mockResolvedValue(ok(genderBody));
    const result = await getGenderByFirstName.run(ctx({ first_name: 'Andrea', country_code: ' it ', locale: 'it-IT' }));
    const req = send.mock.calls[0][0];
    expect(req.url).toBe('https://gender-api.com/v2/gender');
    expect(req.body).toEqual({ first_name: 'Andrea', country: 'IT', locale: 'it-IT' });
    expect(req.headers).toMatchObject({ Authorization: 'Bearer key-123' });
    expect(result).toEqual({
      ...genderBody,
      last_name: null, samples: 3000, country: 'IT', credits_used: 1,
    });
  });

  it('keeps raw details and input for existing name actions (backward compatible)', async () => {
    send.mockResolvedValue(ok(genderBody));
    const first = await getGenderByFirstName.run(ctx({ first_name: 'Andrea' }));
    expect(first).toMatchObject({ details: { samples: 3000, country: 'IT' }, input: genderBody.input, samples: 3000 });
    send.mockResolvedValue(ok({ ...genderBody, last_name: 'Rossi' }));
    const full = await getGenderByFullName.run(ctx({ full_name: 'Andrea Rossi' }));
    expect(full).toMatchObject({ details: { samples: 3000, country: 'IT' }, last_name: 'Rossi' });
  });

  it('keeps raw null gender on existing actions and maps it to unknown on email lookup', async () => {
    const notFound = { ...genderBody, gender: null, result_found: false, probability: null };
    send.mockResolvedValue(ok(notFound));
    const first = await getGenderByFirstName.run(ctx({ first_name: 'Xqzv' }));
    expect(first).toMatchObject({ gender: null, result_found: false });
    const email = await getGenderByEmail.run(ctx({ email: 'xqzv@example.com' }));
    expect(email).toMatchObject({ gender: 'unknown', result_found: false });
  });

  it('drops a country code or locale that is only spaces on every gender lookup', async () => {
    send.mockResolvedValue(ok(genderBody));
    await getGenderByFirstName.run(ctx({ first_name: 'Andrea', country_code: '   ', locale: ' ' }));
    await getGenderByFullName.run(ctx({ full_name: 'Andrea Rossi', country_code: '  ', locale: '  ' }));
    await getGenderByEmail.run(ctx({ email: 'andrea@example.com', country_code: ' ', locale: '   ' }));
    expect(send.mock.calls.map((call) => call[0].body)).toEqual([
      { first_name: 'Andrea' },
      { full_name: 'Andrea Rossi' },
      { email: 'andrea@example.com' },
    ]);
  });

  it('trims and upper-cases the country code and trims the locale on full name and email lookups', async () => {
    send.mockResolvedValue(ok(genderBody));
    await getGenderByFullName.run(ctx({ full_name: 'Andrea Rossi', country_code: ' de ', locale: ' de-DE ' }));
    await getGenderByEmail.run(ctx({ email: 'andrea@example.com', country_code: 'us ', locale: 'en-US' }));
    expect(send.mock.calls.map((call) => call[0].body)).toEqual([
      { full_name: 'Andrea Rossi', country: 'DE', locale: 'de-DE' },
      { email: 'andrea@example.com', country: 'US', locale: 'en-US' },
    ]);
  });

  it('omits optional fields when empty', async () => {
    send.mockResolvedValue(ok(genderBody));
    await getGenderByFullName.run(ctx({ full_name: 'Andrea Rossi' }));
    expect(send.mock.calls[0][0].body).toEqual({ full_name: 'Andrea Rossi' });
  });

  it('email lookup returns last_name', async () => {
    send.mockResolvedValue(ok({ ...genderBody, last_name: 'Doe', first_name: 'Jane', gender: 'female' }));
    const result = await getGenderByEmail.run(ctx({ email: 'jane.doe@example.com' }));
    expect(send.mock.calls[0][0].body).toEqual({ email: 'jane.doe@example.com' });
    expect(result).toMatchObject({ first_name: 'Jane', last_name: 'Doe', gender: 'female' });
  });

  it('country of origin uses the chosen input type key', async () => {
    send.mockResolvedValue(ok({
      first_name: 'Sophie', gender: 'female', probability: 0.99, result_found: true,
      details: { credits_used: 2 },
      country_of_origin: [{ country: 'FR', country_name: 'France', probability: 0.4, continental_region: 'Europe', statistical_region: 'Western Europe' }],
      language_of_origin: 'Greek', meaning: 'wisdom',
    }));
    const result = await getCountryOfOrigin.run(ctx({ input_type: 'full_name', value: 'Sophie Martin' }));
    expect(send.mock.calls[0][0].url).toBe('https://gender-api.com/v2/country-of-origin');
    expect(send.mock.calls[0][0].body).toEqual({ full_name: 'Sophie Martin' });
    expect(result).toMatchObject({ credits_used: 2, country_of_origin: [{ country: 'FR', country_name: 'France', probability: 0.4 }] });
  });

  it('rejects unknown input type without calling the API', async () => {
    await expect(getCountryOfOrigin.run(ctx({ input_type: 'username', value: 'x' }))).rejects.toThrow('Unsupported input type');
    expect(send).not.toHaveBeenCalled();
  });

  it('statistics is a GET without content type', async () => {
    send.mockResolvedValue(ok({ remaining_credits: 95, is_limit_reached: false, usage_last_month: { date: '2026-10', credits_used: 5 } }));
    const result = await getStatistics.run(ctx({}));
    const req = send.mock.calls[0][0];
    expect(req.url).toBe('https://gender-api.com/v2/statistic');
    expect(req.headers).not.toHaveProperty('Content-Type');
    expect(result).toEqual({ remaining_credits: 95, is_limit_reached: false, usage_last_month: { date: '2026-10', credits_used: 5 } });
  });

  it('maps vendor errors to status + responseBody with vendor text and no double period', async () => {
    const vendor = { status: 401, title: 'limit-exceeded', detail: 'You have exceeded your monthly limit.', upgrade_url: 'https://gender-api.com/en/pricing' };
    send.mockRejectedValue(new HttpError({}, { status: 401, responseBody: vendor }));
    const error = await getGenderByFirstName.run(ctx({ first_name: 'A' })).catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 401, responseBody: vendor });
    expect(error).not.toHaveProperty('body');
    const message = String(Reflect.get(Object(error), 'message'));
    expect(message.startsWith('Gender API request failed (401): You have exceeded your monthly limit. Your Gender API credits are used up')).toBe(true);
    expect(message).toContain('https://gender-api.com/en/pricing');
    expect(message).not.toContain('..');
  });

  it('validate accepts good key and rejects bad key with vendor message', async () => {
    send.mockResolvedValueOnce(ok({ remaining_credits: 10 }));
    await expect(genderApiAuth.validate?.({ auth: 'good', server: validationServer })).resolves.toEqual({ valid: true });
    expect(send.mock.calls[0][0].method).toBe('GET');
    send.mockRejectedValueOnce(new HttpError({}, { status: 400, responseBody: { error: 'invalid-auth-token', detail: 'Invalid token' } }));
    const bad = await genderApiAuth.validate?.({ auth: 'bad', server: validationServer });
    expect(bad).toMatchObject({ valid: false });
    expect(JSON.stringify(bad)).toContain('Gender API request failed (400): Invalid token. Check that the API key');
  });
});
