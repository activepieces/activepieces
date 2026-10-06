import { PlatformAdminSurface } from '@activepieces/shared';

import { LockedFeatureCallout, PLATFORM_FEATURES } from '@/features/billing';

export function CustomRolesLockedCallout() {
  return (
    <LockedFeatureCallout
      feature={{ ...PLATFORM_FEATURES.projectRoles, bullets: undefined }}
      headline="plan"
      surface={PlatformAdminSurface.TEASER}
    />
  );
}
