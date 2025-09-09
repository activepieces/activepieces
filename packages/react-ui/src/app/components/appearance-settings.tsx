import { ThemeToggle } from '@/components/theme-toggle';
import { Separator } from '@/components/ui/separator';

export const AppearanceSettings = () => {
  return (
    <>
      <ThemeToggle />
      <div className="!mb-2 px-2">
        <Separator />
      </div>
    </>
  );
};
