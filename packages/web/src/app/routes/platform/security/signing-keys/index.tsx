import {
  EmbedSubdomain,
  EmbedSubdomainStatus,
  SigningKey,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  ExternalLink,
  Globe,
  Key,
  ListChecks,
  LucideIcon,
  MoreHorizontal,
  ShieldCheck,
  Trash,
} from 'lucide-react';
import { ReactNode, useState } from 'react';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/custom/item';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { SkeletonList } from '@/components/ui/skeleton';
import { internalErrorToast } from '@/components/ui/sonner';
import {
  EmbedAllowedDomainsEditor,
  EmbedHostnameForm,
  EmbedHostnameSummary,
  EmbedVerificationStep,
  embedSubdomainQueries,
  signingKeyApi,
  signingKeyQueries,
  NewSigningKeyDialog,
} from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

const SigningKeysPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { subdomain, isLoading: isSubdomainLoading } =
    embedSubdomainQueries.useCurrentEmbedSubdomain();
  const {
    data,
    isLoading: isKeysLoading,
    refetch,
  } = signingKeyQueries.useSigningKeys();
  const signingKeys: SigningKey[] = data?.data ?? [];

  const isLoading = isSubdomainLoading || isKeysLoading;

  const stepCompletion: boolean[] = [
    !!subdomain,
    subdomain?.status === EmbedSubdomainStatus.ACTIVE,
    (subdomain?.allowedEmbedDomains.length ?? 0) > 0,
    signingKeys.length > 0,
  ];

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

  const steps: Array<{ title: string; icon: LucideIcon }> = [
    { title: t('Enter the embed URL'), icon: Globe },
    { title: t('Verify the DNS records'), icon: ShieldCheck },
    { title: t('Add allowed domains'), icon: ListChecks },
    { title: t('Add signing keys'), icon: Key },
  ];

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
            {t(
              'Run embedded workflows under your own domain — four quick steps to get set up.',
            )}
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
            ) : (
              <StepContent
                index={displayedIndex}
                subdomain={subdomain}
                signingKeys={signingKeys}
                refetchSigningKeys={refetch}
                isSigningKeysLoading={isKeysLoading}
              />
            )}
          </div>
        </div>
      </div>
    </LockedFeatureGuard>
  );
};

const Stepper = ({
  steps,
  completion,
  activeStepIndex,
  displayedIndex,
  onStepClick,
}: {
  steps: Array<{ title: string; icon: LucideIcon }>;
  completion: boolean[];
  activeStepIndex: number;
  displayedIndex: number;
  onStepClick: (index: number) => void;
}) => {
  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const isComplete = completion[index];
        const isActive = index === displayedIndex;
        const isLocked = index > activeStepIndex;
        const isLast = index === steps.length - 1;
        const Icon = step.icon;
        return (
          <li key={index} className="flex gap-3">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => onStepClick(index)}
                disabled={isLocked}
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'flex size-8 items-center justify-center transition-colors',
                  isComplete && 'text-success-600',
                  !isComplete && isActive && 'text-primary',
                  !isComplete &&
                    !isActive &&
                    !isLocked &&
                    'text-muted-foreground hover:text-primary',
                  isLocked &&
                    'text-muted-foreground cursor-not-allowed opacity-60',
                )}
              >
                <Icon className="size-5" />
              </button>
              {!isLast && (
                <div
                  className={cn(
                    'w-px flex-1 my-2',
                    isComplete ? 'bg-success-600' : 'bg-border',
                  )}
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => onStepClick(index)}
              disabled={isLocked}
              className={cn(
                'flex-1 text-left pt-1.5 pb-12 text-sm transition-colors',
                isActive && 'font-medium text-foreground',
                !isActive &&
                  !isLocked &&
                  'text-muted-foreground hover:text-foreground',
                isLocked &&
                  'text-muted-foreground cursor-not-allowed opacity-60',
              )}
            >
              <span className="mr-1">{index + 1}.</span>
              {step.title}
            </button>
          </li>
        );
      })}
    </ol>
  );
};

const StepContent = ({
  index,
  subdomain,
  signingKeys,
  refetchSigningKeys,
  isSigningKeysLoading,
}: {
  index: number;
  subdomain: EmbedSubdomain | undefined;
  signingKeys: SigningKey[];
  refetchSigningKeys: () => void;
  isSigningKeysLoading: boolean;
}) => {
  switch (index) {
    case 0:
      return (
        <StepShell
          title={t('Enter the embed URL')}
          description={t(
            "Pick the domain you'll embed in your website. It will be visible inside workflows.",
          )}
        >
          {subdomain ? (
            <EmbedHostnameSummary subdomain={subdomain} />
          ) : (
            <EmbedHostnameForm />
          )}
        </StepShell>
      );
    case 1:
      return (
        <StepShell
          title={t('Verify the DNS records')}
          description={t(
            "Add these records at your DNS provider. We'll detect them automatically — this usually takes a few minutes.",
          )}
        >
          {subdomain && <EmbedVerificationStep subdomain={subdomain} />}
        </StepShell>
      );
    case 2:
      return (
        <StepShell
          title={t('Add allowed domains')}
          description={t(
            'List the websites that can load your embed in an iframe. All other origins are blocked.',
          )}
        >
          {subdomain && <EmbedAllowedDomainsEditor subdomain={subdomain} />}
        </StepShell>
      );
    case 3:
      return (
        <StepShell
          title={t('Add signing keys')}
          description={t(
            "Generate a key to sign each embed session. We'll use the public half to verify your users at runtime.",
          )}
          actions={
            <NewSigningKeyDialog onCreate={refetchSigningKeys}>
              <Button size="sm">{t('New Signing Key')}</Button>
            </NewSigningKeyDialog>
          }
        >
          <SigningKeysList
            signingKeys={signingKeys}
            isLoading={isSigningKeysLoading}
            refetch={refetchSigningKeys}
          />
        </StepShell>
      );
    default:
      return null;
  }
};

const StepShell = ({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) => {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      {children}
    </div>
  );
};

const SigningKeysList = ({
  signingKeys,
  isLoading,
  refetch,
}: {
  signingKeys: SigningKey[];
  isLoading: boolean;
  refetch: () => void;
}) => {
  if (isLoading) {
    return <SkeletonList numberOfItems={3} className="w-full h-[72px]" />;
  }

  if (signingKeys.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
        <Key className="size-10" />
        <p className="text-sm">{t('No signing keys yet')}</p>
      </div>
    );
  }

  return (
    <ItemGroup className="gap-2">
      {signingKeys.map((signingKey) => (
        <Item
          key={signingKey.id}
          variant="outline"
          size="sm"
          className="items-center"
        >
          <ItemMedia variant="icon">
            <Key />
          </ItemMedia>
          <ItemContent className="gap-0">
            <ItemTitle className="flex items-center gap-2">
              {signingKey.displayName}
            </ItemTitle>
            <ItemDescription className="text-xs">
              {' ' + t('Created')}{' '}
              {formatUtils.formatDateToAgo(new Date(signingKey.created))}
              <br />
              <span className="text-xs text-muted-foreground">
                kid: {signingKey.id}
              </span>
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <DropdownMenu modal={true}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="size-8 p-0">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <ConfirmationDeleteDialog
                  title={t('Delete Signing Key')}
                  message={t(
                    'Deleting this signing key will invalidate any tokens signed with it.',
                  )}
                  entityName={t('Signing Key')}
                  buttonText={t('Delete')}
                  mutationFn={async () => {
                    await signingKeyApi.delete(signingKey.id);
                    refetch();
                  }}
                  onError={() => internalErrorToast()}
                >
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash className="size-4 mr-2 text-destructive" />
                    {t('Delete Signing Key')}
                  </DropdownMenuItem>
                </ConfirmationDeleteDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  );
};

SigningKeysPage.displayName = 'SigningKeysPage';
export { SigningKeysPage };
