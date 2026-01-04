import confetti from 'canvas-confetti';
import { t } from 'i18next';
import { Check } from 'lucide-react';
import { useEffect } from 'react';

import bannerImage from '@/assets/img/custom/getting-started-popup-banner.png';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const FirstAccessDialog = ({ open, onOpenChange }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] p-0 overflow-hidden border-none shadow-2xl">
        <Confetti />
        <div className="max-h-[200px] relative w-full aspect-[16/9] bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center overflow-hidden">
          <img
            src={bannerImage}
            alt="Welcome"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-8 space-y-8 bg-white">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              {t('Welcome to Activepieces Enterprise')}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {t(
                "Congrats! You've unlocked powerful tools to drive AI adoption, manage your team, and stay in control — all in one place.",
              )}
            </p>
          </div>

          <div className="space-y-5">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#EFECFF] text-[#6e41e2] shrink-0 mt-0.5">
                  <Check className="w-4 h-4" strokeWidth={3} />
                </div>
                <div className="space-y-0.5 text-left">
                  <h4 className="text-sm font-bold text-gray-900 leading-tight">
                    {benefit.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground italic pl-10">
              {t('... and more.')}
            </p>
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full py-6 text-base font-bold bg-[#6e41e2] hover:bg-[#5835b5] text-white rounded-xl shadow-lg shadow-purple-200"
            >
              {t('Explore Your New Capabilities')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Confetti = () => {
  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 10000,
    };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return null;
};

const benefits = [
  {
    title: t('Leaderboards'),
    description: t(
      'See which users and projects are building the most active flows.',
    ),
  },
  {
    title: t('Team Projects'),
    description: t(
      'Organize your platform by team with isolated data and management.',
    ),
  },
  {
    title: t('AI Gateways'),
    description: t(
      'Connect your preferred AI providers to power unified AI tools.',
    ),
  },
  {
    title: t('Custom Roles'),
    description: t(
      'Define project-level permissions with full role-based access control.',
    ),
  },
];
