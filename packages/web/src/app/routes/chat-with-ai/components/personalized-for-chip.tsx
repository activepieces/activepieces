import {
  ChatPersonalizationStatus,
  PersonalizationProfile,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { companyDomainUtils } from '@/lib/company-domain-utils';

// The quiet line above the cards: says who the set was made for, with Edit /
// Reset as plain text actions. After a reset it flips into a single
// "Personalize for my role" affordance (instant restore when the server still
// holds the researched set, otherwise it asks for website + role and re-runs).
// Deliberately borderless and small — informative, never distracting.
export function PersonalizationBar({
  status,
  profile,
  onRerun,
  onReset,
  onPersonalizeAgain,
}: {
  status: ChatPersonalizationStatus | null;
  profile: PersonalizationProfile | null;
  onRerun: (input: { website: string; role: string }) => void;
  onReset: () => void;
  onPersonalizeAgain: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const personalized = status === ChatPersonalizationStatus.READY;

  if (status === null) {
    return null;
  }

  if (!personalized) {
    // Stored data → instant restore; nothing stored → collect inputs first.
    const canRestore = profile !== null;
    return (
      <div className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        {canRestore ? (
          <button
            type="button"
            onClick={onPersonalizeAgain}
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <Sparkles className="size-3 text-primary/70" />
            {t('Personalize for my role')}
          </button>
        ) : (
          <Popover open={editOpen} onOpenChange={setEditOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <Sparkles className="size-3 text-primary/70" />
                {t('Personalize for my role')}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80">
              <EditPersonalizationForm
                key={editOpen ? 'open' : 'closed'}
                profile={profile}
                onSubmit={(input) => {
                  setEditOpen(false);
                  onRerun(input);
                }}
              />
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="mb-4 flex items-baseline gap-2 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5 truncate">
        <Sparkles className="size-3 shrink-0 text-primary/70" />
        {profile.userRole
          ? t('Personalized for {role} @ {company}', {
              role: profile.userRole,
              company: profile.companyName,
            })
          : t('Personalized for {company}', {
              company: profile.companyName,
            })}
      </span>
      <span aria-hidden>·</span>
      <Popover open={editOpen} onOpenChange={setEditOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="underline-offset-2 transition-colors hover:text-foreground hover:underline"
          >
            {t('Edit')}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80">
          <EditPersonalizationForm
            key={editOpen ? 'open' : 'closed'}
            profile={profile}
            onSubmit={(input) => {
              setEditOpen(false);
              onRerun(input);
            }}
          />
        </PopoverContent>
      </Popover>
      <span aria-hidden>·</span>
      <button
        type="button"
        onClick={onReset}
        className="underline-offset-2 transition-colors hover:text-foreground hover:underline"
      >
        {t('Reset')}
      </button>
    </div>
  );
}

function EditPersonalizationForm({
  profile,
  onSubmit,
}: {
  profile: PersonalizationProfile | null;
  onSubmit: (input: { website: string; role: string }) => void;
}) {
  const [website, setWebsite] = useState(
    profile ? companyDomainUtils.normalizeWebsite(profile.website) ?? '' : '',
  );
  const [role, setRole] = useState(profile?.userRole ?? '');
  const normalized = companyDomainUtils.normalizeWebsite(website);
  const valid = normalized !== null && role.trim().length > 0;

  return (
    // A real <form> so Enter submits from either field.
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (normalized && valid) {
          onSubmit({ website: normalized, role: role.trim() });
        }
      }}
    >
      <p className="text-sm font-medium">{t('Personalize my experience')}</p>
      <div className="grid gap-1.5">
        <Label htmlFor="chipWebsite" className="text-xs">
          {t('Company website')}
        </Label>
        <Input
          id="chipWebsite"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder={t('yourcompany.com')}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="chipRole" className="text-xs">
          {t('Your role')}
        </Label>
        <Input
          id="chipRole"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder={t('e.g. Head of Sales')}
        />
      </div>
      <Button size="sm" type="submit" disabled={!valid}>
        {t('Update my use cases')}
      </Button>
    </form>
  );
}
