import { t } from 'i18next';
import lottie from 'lottie-web';
import { useRef } from 'react';
import { useEffectOnce } from 'react-use';

import celebrationAnimation from '@/assets/img/custom/celeberation.json';

const SuccessScreen = () => {
  const animationContainer = useRef<HTMLDivElement>(null);
  const animationInstance = useRef<any>(null);

  useEffectOnce(() => {
    if (animationContainer.current) {
      animationInstance.current = lottie.loadAnimation({
        container: animationContainer.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: celebrationAnimation,
      });

      return () => {
        if (animationInstance.current) {
          animationInstance.current.destroy();
        }
      };
    }
  });

  return (
    <div className="flex-1 px-6">
      <div className="mx-auto">
        <div className="text-center">
          {/* Lottie Animation */}
          <div ref={animationContainer} className="w-48 h-48 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold mb-3">
            {t('Solution Imported Successfully!')}
          </h2>
          <p className="text-base text-muted-foreground mb-6 max-w-md mx-auto">
            {t(
              'Your solution is now ready to use. Click on any asset in the sidebar to open and explore your newly imported workflows, tables, and agents.',
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export { SuccessScreen };
