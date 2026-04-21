import { PlatformRole } from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CenteredPage } from '@/app/components/centered-page';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { Button } from '@/components/ui/button';
import { aiProviderQueries } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';

import { AiProviderMigrationsTable } from '../model-migration/ai-provider-migrations-table';
import { MigrateFlowsDialog } from '../model-migration/migrate-flows-dialog';

export default function AiProviderMigrationsPage() {
  const navigate = useNavigate();
  const { data: providers } = aiProviderQueries.useAiProviders();
  const { data: currentUser } = userHooks.useCurrentUser();
  const [migrateDialogOpen, setMigrateDialogOpen] = useState(false);
  const {
    platform: {
      plan: { aiProvidersEnabled },
    },
  } = platformHooks.useCurrentPlatform();

  return (
    <LockedFeatureGuard
      featureKey="UNIVERSAL_AI"
      locked={currentUser?.platformRole !== PlatformRole.ADMIN}
      lockTitle={t('Unlock AI')}
      lockDescription={t(
        'Set your AI providers so your users enjoy a seamless building experience with our universal AI pieces',
      )}
    >
      <CenteredPage
        title={t('Migrations')}
        description={t('View migration history and track progress.')}
        maxWidth="max-w-[75rem]"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/platform/setup/ai')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('Back')}
          </Button>
        }
      >
        <AiProviderMigrationsTable
          showMigrateButton={aiProvidersEnabled && (providers?.length ?? 0) > 0}
          onMigrateClick={() => setMigrateDialogOpen(true)}
        />
      </CenteredPage>
      {providers && (
        <MigrateFlowsDialog
          providers={providers}
          open={migrateDialogOpen}
          onOpenChange={setMigrateDialogOpen}
        />
      )}
    </LockedFeatureGuard>
  );
}
