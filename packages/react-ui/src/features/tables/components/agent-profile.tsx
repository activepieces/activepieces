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
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  isRunning?: boolean;
  showSettingsOnHover?: boolean;
  onSettingsClick?: () => void;
  isOpen?: boolean;
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
  isOpen = false,
}: AgentProfileProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
    xxl: 'w-12 h-12',
  };

  const settingsSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
    xxl: 'w-7 h-7',
  };

  const glowClasses = {
    sm: 'shadow-[0_0_8px_rgba(59,130,246,0.5)]',
    md: 'shadow-[0_0_12px_rgba(59,130,246,0.6)]',
    lg: 'shadow-[0_0_16px_rgba(59,130,246,0.7)]',
    xl: 'shadow-[0_0_20px_rgba(59,130,246,0.8)]',
    xxl: 'shadow-[0_0_24px_rgba(59,130,246,0.9)]',
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
        <div className={cn(
          "absolute bg-black bg-opacity-30 rounded-full inset-0 backdrop-blur-0 group-hover:backdrop-blur-[1px] transition-all duration-300 flex items-center justify-center cursor-pointer",
          isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          <Settings className={cn("text-white", settingsSizeClasses[size])} onClick={handleClick} />
        </div>
      )}
    </div>
  );
};

export { AgentProfile };
