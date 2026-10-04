import { CATALOG_CONTROLS } from './catalog';
import { INTEGRATION_CONTROLS } from './integrations';
import { OPERATIONS_CONTROLS } from './operations';
import { PEOPLE_CONTROLS } from './people';
import { SECURITY_CONTROLS } from './security';

export const adminControls = {
  attribute: 'data-ap-control',
  ids: [
    ...PEOPLE_CONTROLS,
    ...CATALOG_CONTROLS,
    ...INTEGRATION_CONTROLS,
    ...SECURITY_CONTROLS,
    ...OPERATIONS_CONTROLS,
  ],
} as const;

export type AdminControlId = (typeof adminControls.ids)[number];
