import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentProfileProps {
  imageUrl?: string;
  enableGlowClass?: boolean;
  onClick?: () => void;
  toggleStatus?: () => void;
  className?: string;
  imageClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  isRunning?: boolean;
  showSettingsOnHover?: boolean;
  onSettingsClick?: () => void;
}

const AgentProfile = ({
  imageUrl = 'https://cdn.activepieces.com/quicknew/agents/robots/robot_186.png',
  enableGlowClass = false,
  onClick,
  className,
  size = 'md',
  imageClassName,
  isRunning = false,
  showSettingsOnHover = false,
}: AgentProfileProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-8 h-8',
  };

  const settingsSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
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
    <div className="relative group">
      <Avatar
        className={cn(
          sizeClasses[size],
          enableGlowClass && glowClasses[size],
          className,
          'border-1 border border-opacity-60 border-black',
        )}
        onClick={handleClick}
      >
        <AvatarImage
          src={imageUrl}
          alt="Agent"
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            showSettingsOnHover && 'group-hover:opacity-50',
            imageClassName
          )}
        />
      </Avatar>
      {isRunning && (
        <div className="bg-radial-colorwheel w-7 h-7 rounded-full absolute right-7 top-0.5 border-2 border-white animate-spin"></div>
      )}
      {showSettingsOnHover && (
        <div className="absolute bg-black bg-opacity-30 rounded-full inset-0 backdrop-blur-0 group-hover:backdrop-blur-[1px] transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer">
          <Settings className={cn("text-white", settingsSizeClasses[size])} onClick={handleClick} />
        </div>
      )}
    </div>
  );
};

export { AgentProfile };
