import { t } from 'i18next';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTitle } from '@/app/components/page-title';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import {
  OnboardingStep,
  synkraOnboardingHooks,
} from '@/features/synkra-onboarding';
import { authenticationSession } from '@/lib/authentication-session';
import { StartPoint, StartPointStep } from './steps/start-point-step';
import { OnboardingProgress } from './steps/progress';
import { UseCaseStep } from './steps/use-case-step';
import { ConnectToolsStep } from './steps/connect-tools-step';
import { WelcomeStep } from './steps/welcome-step';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { embedState } = useEmbedding();
  const { data, isLoading } = synkraOnboardingHooks.useState();
  const advance = synkraOnboardingHooks.useAdvance();
  const [localStep, setLocalStep] = useState<OnboardingStep | null>(null);

  const step: OnboardingStep = localStep ?? data?.step ?? 'welcome';

  const finishOnboarding = async (target: string) => {
    await advance.mutateAsync({ complete: true });
    navigate(target, { replace: true });
  };

  const goTo = async (next: OnboardingStep) => {
    setLocalStep(next);
    await advance.mutateAsync({ step: next });
  };

  const handleSkipAll = async () => {
    await advance.mutateAsync({ skipped: true, complete: true });
    navigate('/', { replace: true });
  };

  const handleStartPoint = async (point: StartPoint) => {
    sessionStorage.setItem('synkra:startPoint', point);
    setLocalStep('connect_tools');
    await advance.mutateAsync({ step: 'connect_tools' });
  };

  const handleConnectToolsNext = async () => {
    const point = (sessionStorage.getItem('synkra:startPoint') ?? 'explore') as StartPoint;
    sessionStorage.removeItem('synkra:startPoint');
    const target =
      point === 'scratch'
        ? authenticationSession.appendProjectRoutePrefix('/flows?newFlow=true')
        : point === 'template'
          ? '/templates'
          : authenticationSession.appendProjectRoutePrefix('/automations');
    await finishOnboarding(target);
  };

  if (isLoading) {
    return (
      <PageTitle title="Welcome to Synkra Flow">
        <div className="flex h-svh items-center justify-center text-gray-11">
          {t('Loading…')}
        </div>
      </PageTitle>
    );
  }

  // If they already completed onboarding or skipped, just bounce.
  if (data?.completedAt || data?.skipped) {
    navigate('/', { replace: true });
    return null;
  }

  const isEmbedded = embedState.isEmbedded;

  return (
    <PageTitle title="Welcome to Synkra Flow">
      <div className="min-h-svh flex flex-col">
        <OnboardingProgress current={step} />

        <div className="flex-1 flex items-center justify-center px-4">
          {step === 'welcome' && (
            <WelcomeStep
              onStart={() => goTo('use_case')}
              onSkip={handleSkipAll}
            />
          )}

          {step === 'use_case' && (
            <UseCaseStep
              initial={data?.primaryUseCase ?? []}
              onNext={async (selected) => {
                await advance.mutateAsync({ useCase: selected });
                await goTo('start_point');
              }}
              onSkip={() => goTo('start_point')}
            />
          )}

          {step === 'start_point' && (
            <StartPointStep
              onChoose={handleStartPoint}
              onSkip={handleSkipAll}
            />
          )}

          {step === 'connect_tools' && (
            <ConnectToolsStep
              useCases={data?.primaryUseCase ?? []}
              onNext={handleConnectToolsNext}
              onSkip={handleConnectToolsNext}
            />
          )}
        </div>

        {!isEmbedded && (
          <div className="px-6 pb-6">
            <Button
              variant="link"
              className="text-xs text-gray-11"
              onClick={handleSkipAll}
            >
              {t('Skip onboarding')}
            </Button>
          </div>
        )}
      </div>
    </PageTitle>
  );
}
