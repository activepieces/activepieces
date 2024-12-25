import { TestResults } from '../components/test-results';
import { cn } from '../../lib/utils';

interface MainContentProps {
  className?: string;
}

export const MainContent = ({ className }: MainContentProps) => {
  console.debug('Rendering MainContent component');

  return (
    <div className={cn('flex-1 bg-gray-100 overflow-hidden', className)}>
      <div className="h-full p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full overflow-hidden">
          <TestResults />
        </div>
      </div>
    </div>
  );
}; 