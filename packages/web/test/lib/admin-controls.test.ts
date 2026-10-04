import { describe, expect, it } from 'vitest';

import { adminControls } from '@/lib/admin-controls';

const CONTROL_ID_PATTERN =
  /^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.(open|submit|confirm|toggle|select|copy|link|run)$/;

describe('adminControls', () => {
  it('names every id area.thing.action with a verb from the fixed set', () => {
    const malformed = adminControls.ids.filter(
      (id) => !CONTROL_ID_PATTERN.test(id),
    );

    expect(malformed).toEqual([]);
  });

  it('never lists the same id twice', () => {
    const duplicated = adminControls.ids.filter(
      (id, index) => adminControls.ids.indexOf(id) !== index,
    );

    expect(duplicated).toEqual([]);
  });

  it('keeps the consent controls of the Configurations page out of the list', () => {
    const consent = adminControls.ids.filter((id) =>
      id.startsWith('configurations.'),
    );

    expect(consent).toEqual([]);
  });
});
