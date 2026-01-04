import { t } from 'i18next';
import React, { useState } from 'react';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { onboardingHooks } from '@/hooks/onboarding-hooks';
import { cn } from '@/lib/utils';
import { OnboardingStep } from '@activepieces/ee-shared';

import { FirstAccessDialog } from './first-access-dialog';
import { OnboardingStepCard, StepData } from './onboarding-step-card';

const STEPS: (StepData & { step: OnboardingStep })[] = [
  {
    step: OnboardingStep.CREATED_PROJECT,
    title: t('Personal & Team Projects'),
    description: t(
      'Personal Projects Every user gets their own private space to build personal productivity agents and flows — safe to experiment, and adopt quickly.',
    ),
    bullets: [
      t(
        'Team Projects Organize your platform by team — Marketing, HR, IT, and more. Each project keeps data isolated and management simple.',
      ),
    ],
    ctaLink: '/platform/projects',
    ctaText: t('Take Me There'),
    image: 'https://cdn.activepieces.com/images/onboarding/create-project.png',
  },
  {
    step: OnboardingStep.MANAGED_ROLES,
    title: t('Custom Roles'),
    description: t(
      'Create project-level roles to control who can access, edit, and execute within each project.',
    ),
    bullets: [
      t(
        'By default, you get two roles: Project Admin and Project Operator. Edit these or create your own custom roles with full role-based access control.',
      ),
    ],
    ctaLink: '/platform/security/project-roles',
    ctaText: t('Take Me There'),
    image: 'https://cdn.activepieces.com/images/onboarding/create-project.png',
  },
  {
    step: OnboardingStep.INVITED_USERS,
    title: t('Invite Users'),
    description: t(
      'Bring your team onto Activepieces. Use SSO for seamless login, or connect SCIM to sync directly with your employee management system.',
    ),
    bullets: [
      t('Their assigned Team Project'),
      t('A Personal Project to build their own workflows'),
      t('Our templates library with step-by-step setup guides'),
      t(
        'Everything they need to start getting value from Activepieces right away.',
      ),
    ],
    ctaLink: '/platform/users',
    ctaText: t('Take Me There'),
    image: 'https://cdn.activepieces.com/images/onboarding/create-project.png',
  },
  {
    step: OnboardingStep.CREATED_AI_MODELS,
    title: t('AI Provider Setup'),
    description: t(
      'Connect your AI provider or gateway — like Cloudflare or OpenRouter — to power AI agents and unified AI tools across the platform.',
    ),
    bullets: [
      t(
        'Your team can start building AI workflows immediately, no API keys to generate, no admin requests.',
      ),
      t(
        'Activepieces sends flow and project metadata to your gateway, so you can set up usage limits, routing rules, and analytics directly within your provider.',
      ),
    ],
    ctaLink: '/platform/setup/ai',
    ctaText: t('Take Me There'),
    image: 'https://cdn.activepieces.com/images/onboarding/create-project.png',
  },
  {
    step: OnboardingStep.MANAGED_PIECES,
    title: t('Manage Pieces'),
    description: t(
      'Pieces are the building blocks of any flow — integrations with everyday apps and internal tools that make automation possible.',
    ),
    bullets: [
      t("Hide pieces from all projects to restrict what's available"),
      t('Add custom pieces for internal apps or proprietary tools'),
      t('Connect your own OAuth 2 app to supported pieces for tighter control'),
    ],
    ctaLink: '/platform/setup/pieces',
    ctaText: t('Take Me There'),
    image: 'https://cdn.activepieces.com/images/onboarding/create-project.png',
  },
  {
    step: OnboardingStep.CREATED_GLOBAL_CONNECTIONS,
    title: t('Global Connections'),
    description: t(
      'Global connections let you set up a connection once and make it available across all or selected projects.',
    ),
    bullets: [
      t(
        'For example, create a Salesforce connection and let users across multiple teams use it in their flows — no need for each person to authenticate separately.',
      ),
      t(
        'All pieces support multiple authentication methods, so you can use service accounts or whatever complies with your internal policies.',
      ),
    ],
    ctaLink: '/platform/setup/connections',
    ctaText: t('Take Me There'),
    image: 'https://cdn.activepieces.com/images/onboarding/create-project.png',
  },
  {
    step: OnboardingStep.EXPLORED_ADOPTION,
    title: t('Explore AI Adoption Features'),
    description: t(
      'Activepieces helps you create a culture of builders — so you can lead AI adoption, not just follow.',
    ),
    bullets: [
      t(
        'Leaderboard See which users and projects are building the most active flows. Spot champions fast and celebrate your most active teams.',
      ),
      t(
        'Impact Track the results of everything you build — ROI, time saved, number of flows, and growth over time.',
      ),
      t(
        'Templates The most advanced templates library in the industry. Each template includes a step-by-step setup guide with calculated ROI and time saved — organized by department.',
      ),
      t(
        "Achievement Badges Add a fun element to building. Badges push users to achieve more and share what they've accomplished.",
      ),
    ],
    ctaLink: '/impact',
    ctaText: t('Explore'),
    image: 'https://cdn.activepieces.com/images/onboarding/create-project.png',
  },
  {
    step: OnboardingStep.CHECKED_HEALTH,
    title: t('Hardware Health'),
    description: t(
      "If you're self-hosting Activepieces, use this page to monitor your infrastructure.",
    ),
    bullets: [
      t(
        'Check whether your disk, CPU, and RAM are sufficient to run smoothly — especially as your organization grows and builds more flows.',
      ),
    ],
    ctaLink: '/platform/infrastructure/health',
    ctaText: t('Check Health'),
    image: 'https://cdn.activepieces.com/images/onboarding/create-project.png',
  },
];

export default function GettingStartedPage() {
  const { data: onboardingStatus } = onboardingHooks.useOnboarding();

  const completedCount = onboardingStatus
    ? Object.values(onboardingStatus).filter(Boolean).length
    : 0;

  const [openStep, setOpenStep] = useState<OnboardingStep | null>(null);
  const [isFirstAccessOpen, setIsFirstAccessOpen] = useState(false);

  React.useEffect(() => {
    if (window.location.hash === '#first-access') {
      setIsFirstAccessOpen(true);
    }
  }, []);

  return (
    <div className="">
      <FirstAccessDialog
        open={isFirstAccessOpen}
        onOpenChange={setIsFirstAccessOpen}
      />
      <DashboardPageHeader title={t('Getting Started')} />

      <div className="flex flex-col w-full gap-8 max-w-[1000px] mx-auto">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">
            {t('Complete {completed} out of {total} steps', {
              completed: completedCount,
              total: STEPS.length,
            })}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t(
              'Finish these setup steps so your platform is fully configured and ready to use.',
            )}
          </p>
        </div>

        <div className="flex flex-col border rounded-lg bg-card overflow-hidden">
          {STEPS.map((step, index) => {
            const isCompleted = onboardingStatus?.[step.step] ?? false;
            const isOpen = openStep === step.step;

            return (
              <div
                key={step.step}
                className={cn(index !== STEPS.length - 1 && 'border-b')}
              >
                <OnboardingStepCard
                  stepData={step}
                  isCompleted={isCompleted}
                  isOpen={isOpen}
                  onOpenChange={(open) => {
                    if (open) setOpenStep(step.step);
                    else if (isOpen) setOpenStep(null);
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
