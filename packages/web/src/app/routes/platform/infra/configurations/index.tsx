import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { Navigate } from 'react-router-dom';

import { CenteredPage } from '@/app/components/centered-page';
import { flagsHooks } from '@/hooks/flags-hooks';

import { TelemetrySection } from './telemetry-section';

export const ConfigurationsPage = () => {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  if (edition === ApEdition.CLOUD) {
    return <Navigate to="/platform/infrastructure/workers" replace />;
  }

  return (
    <CenteredPage title={t('Configurations')}>
      <TelemetrySection />
    </CenteredPage>
  );
};

export default ConfigurationsPage;
