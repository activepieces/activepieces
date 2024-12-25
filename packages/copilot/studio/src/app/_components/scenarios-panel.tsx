import { cn } from '../../lib/utils';
import { Scenarios } from '../components/scenarios';

interface ScenariosPanelProps {
  className?: string;
}

export const ScenariosPanel = ({ className }: ScenariosPanelProps) => {
  console.debug('Rendering ScenariosPanel component');

  return (
    <div className={cn('w-[32rem] bg-white border-l border-gray-200 flex flex-col h-full', className)}>
      <div className="flex-1 p-6">
        <div className="h-full">
          <Scenarios />
        </div>
      </div>
    </div>
  );
}; 