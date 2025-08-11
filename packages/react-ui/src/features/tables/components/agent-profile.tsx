import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AgentProfileProps {
  imageUrl?: string;
  isEnabled?: boolean;
  onClick?: () => void;
  toggleStatus?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const AgentProfile = ({
  imageUrl = 'https://cdn.activepieces.com/quicknew/agents/robots/robot_186.png',
  isEnabled = false,
  onClick,
  className,
  size = 'md',
}: AgentProfileProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-8 h-8',
  };

  const glowClasses = {
    sm: 'shadow-[0_0_8px_rgba(59,130,246,0.5)]',
    md: 'shadow-[0_0_12px_rgba(59,130,246,0.6)]',
    lg: 'shadow-[0_0_16px_rgba(59,130,246,0.7)]',
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className={cn(
        'p-0 border-0 bg-transparent hover:bg-transparent',
        'transition-none', // Remove all transitions
        className,
      )}
      aria-label="Agent Profile"
    >
      <div
        className={cn(
          'relative rounded-full overflow-hidden',
          sizeClasses[size],
          isEnabled && glowClasses[size],
        )}
      >
        <img
          src={imageUrl}
          alt="Agent"
          className="w-full h-full object-cover"
          style={{ display: isEnabled ? 'block' : 'none' }}
        />
        {!isEnabled && (
          <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
            <div className="w-3 h-3 bg-gray-400 dark:bg-gray-500 rounded-full" />
          </div>
        )}
      </div>
    </Button>
  );
};

export { AgentProfile };
