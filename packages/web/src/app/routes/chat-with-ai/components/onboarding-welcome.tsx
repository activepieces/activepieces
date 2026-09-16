import { t } from 'i18next';
import { motion } from 'motion/react';

import { OnboardingJourneyPattern } from './onboarding-journey-pattern';

export function OnboardingWelcome() {
  return (
    <div className="flex min-h-full flex-col pb-7">
      <div className="relative min-h-[7rem] flex-1">
        <OnboardingJourneyPattern />
      </div>
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <div className="flex flex-col items-start gap-4">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
            className="text-balance font-sentient text-3xl font-bold leading-tight sm:text-4xl"
          >
            <span
              className="bg-clip-text font-bold leading-tight text-transparent"
              style={{
                backgroundImage:
                  'linear-gradient(100deg, color-mix(in oklch, var(--color-primary) 80%, #e879f9) 0%, var(--color-primary) 45%, color-mix(in oklch, var(--color-primary) 70%, #38bdf8) 100%)',
              }}
            >
              {t('Who am I teaming up with?')}
            </span>
            <span aria-hidden> 👋</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.25 }}
            className="max-w-xl text-base leading-relaxed text-foreground"
          >
            {t(
              "I'm your AI teammate — research, emails, whole automations, run end to end. Tell me who you are and I'll line up examples built just for you.",
            )}
          </motion.p>
        </div>
      </div>
    </div>
  );
}
