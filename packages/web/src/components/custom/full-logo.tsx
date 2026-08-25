import { t } from 'i18next';

import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';

const FullLogo = ({ className }: { className?: string }) => {
  const branding = flagsHooks.useWebsiteBranding();

  return (
    <div className={cn('h-[60px]', className)}>
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
