// Custom
import { PlatformRole } from '@activepieces/shared';
import { t } from 'i18next';
import { Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { Dot } from '@/components/ui/dot';
import { SidebarMenuButton } from '@/components/ui/sidebar-shadcn';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { userHooks } from '@/hooks/user-hooks';

export function SidebarPlatformAdminButton() {
  const showPlatformAdminDashboard = useIsPlatformAdmin();
  const { embedState } = useEmbedding();
  const navigate = useNavigate();
  const platformRole = userHooks.getCurrentUserPlatformRole();

  if (embedState.isEmbedded || !showPlatformAdminDashboard) {
    return null;
  }

  return (
    <SidebarMenuButton
      onClick={() => navigate('/platform')}
      className="py-5 px-2"
    >
      <div className={`w-full flex items-center gap-2`}>
        <Shield className="size-4" />
        <span className={`text-sm`}>{t('Platform Admin')}</span>
      </div>
      {false && platformRole === PlatformRole.ADMIN && (
        <Dot
          variant="primary"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 size-2 rounded-full"
        />
      )}
    </SidebarMenuButton>
  );
}
