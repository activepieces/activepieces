import { cn } from '@/lib/utils';

const LargeWidgetWrapper = ({
  children,
  containerClassName,
}: {
  children: React.ReactNode;
  containerClassName?: string;
}) => {
  return (
    <div className="absolute top-2 z-40 flex w-full justify-center px-2">
      <div
        className={cn(
          'z-40 flex min-h-12 w-full animate-fade items-center justify-between gap-2 rounded-xl border border-gray-6 bg-panel px-3 py-2 text-sm duration-300',
          containerClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
};
LargeWidgetWrapper.displayName = 'LargeWidgetWrapper';
export default LargeWidgetWrapper;
