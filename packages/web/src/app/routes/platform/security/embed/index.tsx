import {
  ApEdition,
  ApFlagId,
  EmbedSubdomainStatus,
  SigningKey,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  ExternalLink,
  Globe,
  Key,
  ListChecks,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SkeletonList } from '@/components/ui/skeleton';
import {
  embedSubdomainQueries,
  signingKeyQueries,
} from '@/features/platform-admin';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { Stepper, StepKind, StepDef } from './stepper';
import { AllowedDomainsStep } from './steps/allowed-domains-step';
import { DnsStep } from './steps/dns-step';
import { HostnameStep } from './steps/hostname-step';
import { SigningKeysStep } from './steps/signing-keys-step';

const EmbedPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isCloud = edition === ApEdition.CLOUD;

  const { subdomain, isLoading: isSubdomainLoading } =
    embedSubdomainQueries.useCurrentEmbedSubdomain();
  const {
    data,
    isLoading: isKeysLoading,
    refetch,
  } = signingKeyQueries.useSigningKeys();
  const signingKeys: SigningKey[] = data?.data ?? [];

  const isLoading = (isCloud && isSubdomainLoading) || isKeysLoading;

  const allowedEmbedDomains = platform.allowedEmbedDomains ?? [];

  const allSteps: Record<StepKind, StepDef> = {
    hostname: {
      kind: 'hostname',
      title: t('Enter the embed URL'),
      icon: Globe,
    },
    dns: {
      kind: 'dns',
      title: t('Verify the DNS records'),
      icon: ShieldCheck,
    },
    'allowed-domains': {
      kind: 'allowed-domains',
      title: t('Add allowed domains'),
      icon: ListChecks,
    },
    'signing-keys': {
      kind: 'signing-keys',
      title: t('Add signing keys'),
      icon: Key,
    },
  };

  const steps: StepDef[] = isCloud
    ? [
        allSteps.hostname,
        allSteps.dns,
        allSteps['allowed-domains'],
        allSteps['signing-keys'],
      ]
    : [allSteps['allowed-domains'], allSteps['signing-keys']];

  const completionByKind: Record<StepKind, boolean> = {
    hostname: !!subdomain,
    dns: subdomain?.status === EmbedSubdomainStatus.ACTIVE,
    'allowed-domains': allowedEmbedDomains.length > 0,
    'signing-keys': signingKeys.length > 0,
  };

  const stepCompletion = steps.map((step) => completionByKind[step.kind]);

  const firstIncompleteIndex = stepCompletion.findIndex((done) => !done);
  const activeStepIndex =
    firstIncompleteIndex === -1
      ? stepCompletion.length - 1
      : firstIncompleteIndex;

  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const displayedIndex =
    viewingIndex !== null && viewingIndex < activeStepIndex
      ? viewingIndex
      : activeStepIndex;

  const handleStepClick = (index: number) => {
    if (index > activeStepIndex) return;
    setViewingIndex(index === activeStepIndex ? null : index);
  };

  const description = isCloud
    ? t(
        'Run embedded workflows under your own domain — four quick steps to get set up.',
      )
    : t(
        'Configure who can embed your workflows and create the signing keys to authenticate sessions.',
      );

  const displayedStep = steps[displayedIndex];

  return (
    <LockedFeatureGuard
      featureKey="SIGNING_KEYS"
      locked={!platform.plan.embeddingEnabled}
      lockTitle={t('Unlock Embedding Through JS SDK')}
      lockDescription={t(
        'Enable signing keys to access embedding functionalities.',
      )}
    >
      <div className="w-full max-w-6xl mx-auto py-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-medium">{t('Embed Onboarding')}</h1>
          <div className="text-sm text-muted-foreground">
            {description}
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 mt-0.5 ml-1"
              asChild
            >
              <a
                href="https://www.activepieces.com/docs/embedding/overview"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('Read more')}
                <ExternalLink className="size-3" />
              </a>
            </Button>
          </div>
        </div>
        <Separator className="mt-4 mb-12" />

        <div className="grid grid-cols-[16rem_1fr] gap-16">
          <Stepper
            steps={steps}
            completion={stepCompletion}
            activeStepIndex={activeStepIndex}
            displayedIndex={displayedIndex}
            onStepClick={handleStepClick}
          />

          <div className="min-w-0">
            {isLoading ? (
              <SkeletonList numberOfItems={3} className="w-full h-[72px]" />
            ) : displayedStep?.kind === 'hostname' ? (
              <HostnameStep subdomain={subdomain} />
            ) : displayedStep?.kind === 'dns' ? (
              <DnsStep subdomain={subdomain} />
            ) : displayedStep?.kind === 'allowed-domains' ? (
              <AllowedDomainsStep allowedEmbedDomains={allowedEmbedDomains} />
            ) : displayedStep?.kind === 'signing-keys' ? (
              <SigningKeysStep
                signingKeys={signingKeys}
                isLoading={isKeysLoading}
                refetch={refetch}
              />
            ) : null}
          </div>
        </div>
      </div>
    </LockedFeatureGuard>
  );
};

EmbedPage.displayName = 'EmbedPage';
export { EmbedPage };
