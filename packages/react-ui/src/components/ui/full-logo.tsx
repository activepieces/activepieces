import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';

import { flagsHooks } from '@/hooks/flags-hooks';

const FullLogo = () => {
  const queryClient = useQueryClient();
  const branding = flagsHooks.useWebsiteBranding(queryClient);

  return (
    <div className="h-[60px]">
      <img
        className="h-full"
        src={branding.logos.fullLogoUrl}
        alt={t('logo')}
      />
    </div>
  );
};
FullLogo.displayName = 'FullLogo';
export { FullLogo };
