import { beforeEach, describe, expect, it, vi } from 'vitest';

const { request } = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock('../../common/client', () => ({
  createClient: () => ({ request }),
}));

import { getTemplate } from '../get-template';

const fullTemplate = {
  id: 'tpl_1',
  name: 'Promo',
  polotno_json: { pages: [] },
};

const buildContext = (propsValue: Record<string, unknown>) =>
  ({
    auth: { secret_text: 'key_live_x' },
    propsValue,
  } as unknown as Parameters<typeof getTemplate.run>[0]);

describe('getTemplate.run', () => {
  beforeEach(() => {
    request.mockReset();
  });

  it('strips the design when omit_design is true', async () => {
    request.mockResolvedValue(fullTemplate);

    const result = await getTemplate.run(buildContext({ template_id: 'tpl_1', omit_design: true }));

    expect(result).toEqual({ id: 'tpl_1', name: 'Promo' });
  });

  it('strips the design when omit_design is undefined', async () => {
    request.mockResolvedValue(fullTemplate);

    const result = await getTemplate.run(buildContext({ template_id: 'tpl_1' }));

    expect(result).toEqual({ id: 'tpl_1', name: 'Promo' });
  });

  it('returns the full template when omit_design is false', async () => {
    request.mockResolvedValue(fullTemplate);

    const result = await getTemplate.run(buildContext({ template_id: 'tpl_1', omit_design: false }));

    expect(result).toEqual(fullTemplate);
  });

  it('requests the template by its encoded id', async () => {
    request.mockResolvedValue(fullTemplate);

    await getTemplate.run(buildContext({ template_id: 'tpl 1', omit_design: false }));

    expect(request.mock.calls[0][0].path).toBe('/v1/templates/tpl%201');
  });
});
