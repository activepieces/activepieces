import { DialogTitle } from '@radix-ui/react-dialog';
import { t } from 'i18next';
import { Award, Camera, Mail } from 'lucide-react';
import { useRef, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserAvatar } from '@/components/ui/user-avatar';
import { userHooks } from '@/hooks/user-hooks';

import { DeleteAccount } from './delete-account';
import LanguageToggle from './language-toggle';
import ThemeToggle from './theme-toggle';

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  earnedAt: string;
}

export interface UserProfileData {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  profilePictureUrl?: string;
  badges?: UserBadge[];
}

export interface UserProfileDialogProps {
  open: boolean;
  onClose: () => void;
  user?: UserProfileData;
  isOwner?: boolean;
}

// TODO: ts mock data, get from db later
const MOCK_BADGES: UserBadge[] = [
  {
    id: '1',
    name: 'Early Adopter',
    description: 'Joined during the early access period',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2620/2620653.png',
    earnedAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Flow Master',
    description: 'Created 10+ flows',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3176/3176371.png',
    earnedAt: '2024-02-20',
  },
  {
    id: '3',
    name: 'Time Saver',
    description: 'Saved 100+ hours with automations',
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972531.png',
    earnedAt: '2024-03-10',
  },
];

export function UserProfileDialog({
  open,
  onClose,
  user: providedUser,
  isOwner,
}: UserProfileDialogProps) {
  const { data: currentUser } = userHooks.useCurrentUser();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = providedUser ?? currentUser;

  const badges = providedUser?.badges ?? MOCK_BADGES;

  const handleProfilePictureClick = () => {
    if (isOwner) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const displayPicture = profilePicture ?? providedUser?.profilePictureUrl;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={`${isOwner ? 'max-w-2xl' : 'max-w-md'} w-full max-h-[90vh] pb-4 flex flex-col px-5`}
      >
        <DialogHeader>
          <DialogTitle className="font-semibold">
            {isOwner ? t('Account Settings') : t('User Profile')}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1" viewPortClassName="px-1">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div
                className={`relative ${isOwner ? 'group cursor-pointer' : ''}`}
                onClick={handleProfilePictureClick}
              >
                {displayPicture ? (
                  <img
                    src={displayPicture}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <UserAvatar
                    name={(user?.firstName ?? '') + ' ' + (user?.lastName ?? '')}
                    email={isOwner ? (user?.email ?? '') : ''}
                    size={64}
                    disableTooltip
                  />
                )}
                {isOwner && (
                  <>
                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </>
                )}
              </div>
              <div>
                <div className="text-base font-semibold">
                  {user?.firstName} {user?.lastName}
                </div>
                {isOwner && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {user?.email}
                  </div>
                )}
              </div>
            </div>

            {badges.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Award className="w-4 h-4" />
                    {t('Badges')}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {badges.map((badge) => (
                      <Tooltip key={badge.id}>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center gap-1.5 cursor-default">
                            <img
                              src={badge.iconUrl}
                              alt={badge.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-border bg-muted p-1"
                            />
                            <span className="text-xs text-muted-foreground max-w-[60px] truncate text-center">
                              {badge.name}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-center">
                            <p className="font-medium">{badge.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {badge.description}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </>
            )}

            {isOwner && (
              <>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ThemeToggle />
                  <LanguageToggle />
                </div>
                <DeleteAccount />
              </>
            )}
          </div>
        </ScrollArea>
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}

export default UserProfileDialog;
