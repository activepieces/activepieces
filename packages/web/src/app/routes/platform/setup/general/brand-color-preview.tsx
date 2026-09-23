import { brandColors, PrimaryRoles } from '@activepieces/shared';
import { t } from 'i18next';

import { Badge } from '@/components/ui/badge';

export const BrandColorPreview = ({ color }: BrandColorPreviewProps) => {
  const light = brandColors.primaryRoles({
    primaryColor: color,
    theme: 'light',
  });
  const dark = brandColors.primaryRoles({ primaryColor: color, theme: 'dark' });
  if (light === null || dark === null) {
    return null;
  }

  const report = brandColors.describeContrast({ hex: color });
  const labelIsWhite = report.onWhite >= report.onBlack;

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-ink-muted">
          {t('Label contrast')}
        </span>
        <Badge variant={report.passesText ? 'success' : 'warning'}>
          {report.best.toFixed(2)}:1
        </Badge>
        <span className="text-xs text-ink-muted">
          {labelIsWhite ? t('white label') : t('black label')}
        </span>
        {!report.passesText && (
          <span className="text-xs text-warning-ink">
            {t('Below the 4.5:1 minimum for readable text')}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <RolePreview label={t('Light')} roles={light} />
        <RolePreview label={t('Dark')} roles={dark} inverse />
      </div>
    </div>
  );
};

const RolePreview = ({ label, roles, inverse }: RolePreviewProps) => (
  <div
    data-theme={inverse ? 'dark' : 'light'}
    className="flex min-w-[170px] flex-1 flex-col gap-2 rounded-md border border-border bg-surface-raised p-3"
  >
    <span className="text-xs font-medium text-ink-muted">{label}</span>
    <span
      className="rounded-md px-3 py-1.5 text-center text-sm"
      style={{ backgroundColor: roles.primary, color: roles.onPrimary }}
    >
      {t('Button')}
    </span>
    <div className="flex items-center gap-1.5">
      <RoleDot color={roles.mark} title={t('Mark')} />
      <RoleDot color={roles.line} title={t('Line')} />
      <RoleDot color={roles.ink} title={t('Ink')} />
      <RoleDot color={roles.hover} title={t('Hover')} />
    </div>
  </div>
);

const RoleDot = ({ color, title }: RoleDotProps) => (
  <span
    title={title}
    className="size-5 rounded-full border border-border"
    style={{ backgroundColor: color }}
  />
);

type BrandColorPreviewProps = {
  color: string;
};

type RolePreviewProps = {
  label: string;
  roles: PrimaryRoles;
  inverse?: boolean;
};

type RoleDotProps = {
  color: string;
  title: string;
};
