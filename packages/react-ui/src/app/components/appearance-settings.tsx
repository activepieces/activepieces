import { useEmbedding } from '@/components/embed-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { Separator } from '@/components/ui/separator';

export const AppearanceSettings = () => {
  const { embedState } = useEmbedding();
  if (embedState.isEmbedded) return null;
  return (
    <>
      <ThemeToggle />
      <div className="!mb-2 px-2">
        <Separator />
      </div>
    </>
  );
};
