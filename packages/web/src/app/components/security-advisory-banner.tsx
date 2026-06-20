import { t } from 'i18next';
import { TriangleAlertIcon, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  healthQueries,
  useSecurityAdvisoryStore,
} from '@/features/platform-admin';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';

const HEALTH_PAGE_PATH = '/platform/infrastructure/health';

const AdminBanner = () => {
  const { data: advisories } = healthQueries.useSecurityAdvisories();
  const navigate = useNavigate();
  const dismissedIds = useSecurityAdvisoryStore((s) => s.dismissedIds);
  const markDismissed = useSecurityAdvisoryStore((s) => s.markDismissed);

  if (!advisories) return null;

  const highOrCritical = advisories.advisories.filter(
    (a) => a.severity === 'high' || a.severity === 'critical',
  );
  if (highOrCritical.length === 0) return null;
  if (highOrCritical.every((a) => dismissedIds.includes(a.id))) return null;

  const idsToMark = highOrCritical.map((a) => a.id);
  const handleOpen = () => {
    navigate(`${HEALTH_PAGE_PATH}?tab=security`);
  };
  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    markDismissed(idsToMark);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpen();
        }
      }}
      className="flex w-full cursor-pointer items-center gap-3 border-b bg-destructive-50 px-4 py-2.5 text-sm text-destructive-700 dark:bg-destructive-950 dark:text-destructive-300"
    >
      <TriangleAlertIcon className="size-4 shrink-0" />
      <div className="min-w-0 flex-1 truncate">
        <span className="font-medium">
          {t('Security issue affects this version')}
        </span>
        <span className="opacity-90">
          {': '}
          {t(
            'Update v{version} to patch {count, plural, =1 {# issue} other {# issues}}',
            {
              count: highOrCritical.length,
              version: advisories.currentVersion,
            },
          )}
        </span>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={t('Dismiss')}
        className="shrink-0 rounded-md p-1 opacity-70 hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  );
};

const SecurityAdvisoryBanner = () => {
  const isPlatformAdmin = useIsPlatformAdmin();
  if (!isPlatformAdmin) return null;
  return <AdminBanner />;
};

export { SecurityAdvisoryBanner };
