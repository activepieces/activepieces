import {
  CreateOrganization,
  OrganizationProfile,
  useClerk,
  useOrganization,
  useOrganizationList,
  useUser,
} from '@clerk/clerk-react';
import { t } from 'i18next';
import {
  Building2,
  ChevronsUpDown,
  LogOut,
  Plus,
  Settings,
  Users,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { AccountSettingsDialog } from '@/app/components/account-settings';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar-shadcn';
import { userHooks } from '@/hooks/user-hooks';
import { otom8ClerkAppearance } from '@/lib/otom8-clerk-appearance';

export function SidebarUser() {
  const { embedState } = useEmbedding();
  const { state } = useSidebar();
  // Clerk session may not be present on app.otom8.us — always fall back to AP user
  const { user: clerkUser } = useUser();
  const { organization } = useOrganization();
  const { userMemberships } = useOrganizationList({ userMemberships: true });
  const { signOut, setActive } = useClerk();
  const { data: apUser } = userHooks.useCurrentUser();
  const isCollapsed = state === 'collapsed';

  const [accountOpen, setAccountOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [createOrgOpen, setCreateOrgOpen] = useState(false);

  // Re-run SSO whenever the active Clerk org changes so AP's project context
  // moves with the user. We skip the first render (baseline value).
  const lastOrgRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const current = organization?.id ?? null;
    if (lastOrgRef.current === undefined) {
      lastOrgRef.current = current;
      return;
    }
    if (lastOrgRef.current !== current) {
      lastOrgRef.current = current;
      window.location.replace('/api/ap-sso');
    }
  }, [organization?.id]);

  if (!apUser || embedState.isEmbedded) {
    return null;
  }

  const firstName = apUser.firstName ?? clerkUser?.firstName ?? '';
  const lastName = apUser.lastName ?? clerkUser?.lastName ?? '';
  const email = apUser.email ?? clerkUser?.primaryEmailAddress?.emailAddress ?? '';
  const imageUrl = clerkUser?.imageUrl ?? apUser.imageUrl ?? undefined;
  const displayName = firstName && lastName ? `${firstName} ${lastName}` : email;
  const initials = [firstName[0], lastName[0]].filter(Boolean).join('') || '?';
  const workspaceName = organization?.name ?? t('Personal');

  const handleSignOut = () => {
    if (clerkUser) {
      signOut({ redirectUrl: '/login' });
    } else {
      window.location.replace('/login');
    }
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 hover:bg-accent transition-colors text-left outline-none"
                data-testid="sidebar-user"
              >
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={imageUrl} alt={displayName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-tight">
                        {displayName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground mt-0.5">
                        {workspaceName}
                      </p>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side="top"
              align="start"
              className="w-64"
              sideOffset={4}
            >
              {/* User info header — non-interactive */}
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{email}</p>
              </div>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() =>
                  clerkUser
                    ? setAccountOpen(true)
                    : window.location.replace('/login')
                }
              >
                <Settings className="mr-2 h-4 w-4" />
                {t('Account Settings')}
              </DropdownMenuItem>

              {organization && (
                <DropdownMenuItem onClick={() => setTeamOpen(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  {t('Team Settings')}
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                {t('Workspaces')}
              </DropdownMenuLabel>

              {/* Personal workspace */}
              <DropdownMenuItem
                className="gap-2"
                onClick={() => clerkUser && setActive({ organization: null })}
              >
                <div className="h-4 w-4 shrink-0 rounded-sm bg-muted flex items-center justify-center text-[10px] font-medium">
                  {firstName[0] ?? '?'}
                </div>
                <span className="flex-1 truncate">{t('Personal')}</span>
                {!organization && (
                  <span className="text-xs text-muted-foreground">✓</span>
                )}
              </DropdownMenuItem>

              {/* Org memberships */}
              {userMemberships?.data?.map((m) => (
                <DropdownMenuItem
                  key={m.organization.id}
                  className="gap-2"
                  onClick={() =>
                    clerkUser && setActive({ organization: m.organization.id })
                  }
                >
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{m.organization.name}</span>
                  {organization?.id === m.organization.id && (
                    <span className="text-xs text-muted-foreground">✓</span>
                  )}
                </DropdownMenuItem>
              ))}

              <DropdownMenuItem
                className="gap-2"
                onClick={() => setCreateOrgOpen(true)}
              >
                <Plus className="h-4 w-4 shrink-0" />
                {t('Create Workspace')}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive focus:text-destructive gap-2"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {t('Sign out')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Account Settings — only mount when Clerk session exists */}
      {clerkUser && (
        <AccountSettingsDialog
          open={accountOpen}
          onClose={() => setAccountOpen(false)}
        />
      )}

      {/* Team Settings — Clerk OrganizationProfile */}
      <Dialog open={teamOpen} onOpenChange={setTeamOpen}>
        <DialogContent className="max-w-4xl w-full h-[85vh] p-0 overflow-hidden bg-[#111111] border-white/8">
          <OrganizationProfile
            appearance={{
              ...otom8ClerkAppearance,
              elements: {
                ...otom8ClerkAppearance.elements,
                rootBox: { width: '100%', height: '100%' },
                cardBox: {
                  width: '100%',
                  height: '100%',
                  boxShadow: 'none',
                  border: 'none',
                  borderRadius: 0,
                  backgroundColor: '#111111',
                },
              },
            }}
            routing="hash"
          />
        </DialogContent>
      </Dialog>

      {/* Create Workspace — only mount when Clerk session exists */}
      {clerkUser && (
        <Dialog open={createOrgOpen} onOpenChange={setCreateOrgOpen}>
          <DialogContent className="max-w-lg p-0 overflow-hidden">
            <CreateOrganization
              appearance={otom8ClerkAppearance}
              afterCreateOrganizationUrl="/api/ap-sso"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
