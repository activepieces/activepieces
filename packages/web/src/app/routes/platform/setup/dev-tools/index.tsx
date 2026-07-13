import {
  ApEnvironment,
  ApFlagId,
  PlatformPlanLimits,
  TeamProjectsLimit,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';

import { DevToolsPlanPreset } from '@/api/dev-tools-api';
import { CenteredPage } from '@/app/components/centered-page';
import { EditionBadge } from '@/app/components/edition-badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

export function DevToolsPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: environment } = flagsHooks.useFlag<ApEnvironment>(
    ApFlagId.ENVIRONMENT,
  );
  const queryClient = useQueryClient();
  const { mutate, isPending } =
    platformHooks.useDevToolsUpdatePlan(queryClient);
  const [creditsInput, setCreditsInput] = useState('');

  if (environment !== ApEnvironment.DEVELOPMENT) {
    return <Navigate to="/platform" replace />;
  }

  const plan = platform.plan;
  const presets: { value: DevToolsPlanPreset; label: string }[] = [
    { value: 'OPEN_SOURCE', label: t('Open Source') },
    { value: 'STANDARD_CLOUD', label: t('Cloud Free') },
    { value: 'ENTERPRISE', label: t('Enterprise') },
  ];

  return (
    <CenteredPage
      title={t('Dev Tools')}
      description={t(
        'Simulate plan tiers, feature flags, limits, and AI credits for this platform. Changes apply instantly with no restart. Switching edition (CE / EE / Cloud) still requires restarting the server with a different AP_EDITION.',
      )}
    >
      <div className="flex flex-col gap-6">
        <EditionBadge />

        <Card>
          <CardHeader>
            <CardTitle>{t('Plan presets')}</CardTitle>
            <CardDescription>
              {t(
                'Apply a full plan snapshot. Use this to realign your plan with the edition you are testing.',
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.value}
                variant="basic"
                disabled={isPending}
                onClick={() => mutate({ type: 'preset', preset: preset.value })}
              >
                {preset.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('Feature flags')}</CardTitle>
            <CardDescription>
              {t(
                'Toggle individual plan features. Gated pages lock and unlock immediately.',
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {BOOLEAN_PLAN_FLAGS.map((flag) => (
              <div
                key={flag}
                className="flex items-center justify-between gap-4 rounded-lg border bg-card p-3"
              >
                <span className="text-sm font-mono">{flag}</span>
                <Switch
                  checked={plan[flag] === true}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    mutate({ type: 'patch', patch: flagPatch(flag, checked) })
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('Limits')}</CardTitle>
            <CardDescription>
              {t('Leave a field empty to set it to unlimited.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <LimitField
              label={t('Active flows limit')}
              value={plan.activeFlowsLimit}
              disabled={isPending}
              onCommit={(value) =>
                mutate({ type: 'patch', patch: { activeFlowsLimit: value } })
              }
            />
            <LimitField
              label={t('Projects limit')}
              value={plan.projectsLimit}
              disabled={isPending}
              onCommit={(value) =>
                mutate({ type: 'patch', patch: { projectsLimit: value } })
              }
            />
            <div className="flex items-center justify-between gap-4">
              <Label>{t('Team projects limit')}</Label>
              <Select
                value={plan.teamProjectsLimit}
                disabled={isPending}
                onValueChange={(value) => {
                  const next = Object.values(TeamProjectsLimit).find(
                    (option) => option === value,
                  );
                  if (next) {
                    mutate({
                      type: 'patch',
                      patch: { teamProjectsLimit: next },
                    });
                  }
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TeamProjectsLimit).map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('AI credits')}</CardTitle>
            <CardDescription>
              {t(
                'Included AI credits for this platform. Drain to zero to exercise the out-of-credits (402) path.',
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="text-sm text-muted-foreground">
              {t('Current included credits')}:{' '}
              <span className="font-medium text-foreground">
                {plan.includedAiCredits}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="number"
                className="w-40"
                placeholder={t('Credits')}
                value={creditsInput}
                disabled={isPending}
                onChange={(e) => setCreditsInput(e.target.value)}
              />
              <Button
                variant="basic"
                disabled={isPending || creditsInput.trim() === ''}
                onClick={() =>
                  mutate({
                    type: 'credits',
                    includedAiCredits: Number(creditsInput),
                  })
                }
              >
                {t('Set credits')}
              </Button>
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() => mutate({ type: 'credits', drainToZero: true })}
              >
                {t('Drain to 0')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </CenteredPage>
  );
}

function flagPatch(
  flag: BooleanPlanFlag,
  value: boolean,
): Partial<PlatformPlanLimits> {
  const patch: Partial<PlatformPlanLimits> = {};
  patch[flag] = value;
  return patch;
}

function LimitField({
  label,
  value,
  disabled,
  onCommit,
}: {
  label: string;
  value: number | null | undefined;
  disabled: boolean;
  onCommit: (value: number | null) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label>{label}</Label>
      <Input
        key={String(value)}
        type="number"
        defaultValue={value ?? ''}
        placeholder={t('unlimited')}
        className="w-40"
        disabled={disabled}
        onBlur={(e) => {
          const raw = e.target.value.trim();
          onCommit(raw === '' ? null : Number(raw));
        }}
      />
    </div>
  );
}

const BOOLEAN_PLAN_FLAGS = [
  'chatEnabled',
  'agentsEnabled',
  'tablesEnabled',
  'aiProvidersEnabled',
  'embeddingEnabled',
  'analyticsEnabled',
  'auditLogEnabled',
  'eventStreamingEnabled',
  'environmentsEnabled',
  'globalConnectionsEnabled',
  'managePiecesEnabled',
  'manageTemplatesEnabled',
  'customAppearanceEnabled',
  'projectRolesEnabled',
  'customRolesEnabled',
  'apiKeysEnabled',
  'ssoEnabled',
  'scimEnabled',
  'secretManagersEnabled',
  'showPoweredBy',
] as const;

type BooleanPlanFlag = (typeof BOOLEAN_PLAN_FLAGS)[number];
