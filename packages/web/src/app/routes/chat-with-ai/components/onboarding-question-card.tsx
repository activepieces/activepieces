import { t } from 'i18next';
import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import {
  KeyboardEvent,
  RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import { Button } from '@/components/ui/button';
import { useCompanySuggestions } from '@/features/chat/lib/use-company-suggestions';
import { userHooks } from '@/hooks/user-hooks';
import { commonRoles } from '@/lib/common-roles';
import { cn } from '@/lib/utils';

import { InteractiveCardShell } from './interactive-card-shell';

export function OnboardingQuestionCard({
  initialRole = '',
  initialCompany = '',
  initialCompanyDomain = null,
  companyLocked = false,
  active = true,
  submitLabel,
  onComplete,
  onDismiss,
}: {
  initialRole?: string;
  initialCompany?: string;
  initialCompanyDomain?: string | null;
  companyLocked?: boolean;
  active?: boolean;
  submitLabel?: string;
  onComplete: (answers: OnboardingAnswers) => void;
  onDismiss: () => void;
}) {
  const { data: user } = userHooks.useCurrentUser();
  const [role, setRole] = useState(initialRole);
  const [company, setCompany] = useState(initialCompany);
  const [companyDomain, setCompanyDomain] = useState<string | null>(
    initialCompanyDomain,
  );
  const [touched, setTouched] = useState(false);
  const [lastPrefill, setLastPrefill] = useState({
    role: initialRole,
    company: initialCompany,
  });
  const [done, setDone] = useState(false);
  const companyRef = useRef<HTMLInputElement>(null);

  if (
    !touched &&
    (initialRole !== lastPrefill.role || initialCompany !== lastPrefill.company)
  ) {
    setLastPrefill({ role: initialRole, company: initialCompany });
    setRole(initialRole);
    setCompany(initialCompany);
    setCompanyDomain(initialCompanyDomain);
  }

  const roleSuggestions: OnboardingSuggestion[] = commonRoles
    .suggestRoles({ query: role, limit: 5 })
    .map((value) => ({ value }));
  const companySuggestions = useCompanySuggestions({
    query: companyLocked ? '' : company,
    email: user?.email,
  });

  const valid =
    role.trim().length > 0 && (companyLocked || company.trim().length > 0);

  const focusField =
    initialRole.trim().length === 0
      ? 'role'
      : initialCompany.trim().length === 0
      ? 'company'
      : 'none';

  const submit = () => {
    if (!valid || done) {
      return;
    }
    setDone(true);
    onComplete({
      role: role.trim(),
      company: company.trim(),
      companyDomain,
    });
  };

  return (
    <InteractiveCardShell
      onDismiss={onDismiss}
      active={active}
      title={
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3 py-1.5 font-sentient text-lg font-semibold sm:text-xl">
          <span>{t("I'm a")}</span>
          <OnboardingPill
            value={role}
            onChange={(text) => {
              setTouched(true);
              setRole(text);
            }}
            examples={ROLE_EXAMPLES}
            suggestions={roleSuggestions}
            onPickSuggestion={(suggestion) => {
              setTouched(true);
              setRole(suggestion.value);
              companyRef.current?.focus();
            }}
            onEnter={submit}
            ariaLabel={t('Your role')}
            autoFocus={focusField === 'role'}
          />
          <span>{t('at')}</span>
          {companyLocked ? (
            <span className="text-foreground/80">{company}</span>
          ) : (
            <OnboardingPill
              inputRef={companyRef}
              value={company}
              onChange={(text) => {
                setTouched(true);
                setCompany(text);
                setCompanyDomain(null);
              }}
              examples={COMPANY_EXAMPLES}
              suggestions={companySuggestions}
              onPickSuggestion={(suggestion) => {
                setTouched(true);
                setCompany(suggestion.value);
                setCompanyDomain(suggestion.domain ?? null);
              }}
              onEnter={submit}
              ariaLabel={t('Your company, industry, or website')}
              autoFocus={focusField === 'company'}
            />
          )}
        </div>
      }
    >
      <div className="flex justify-end pb-1 pt-2">
        <Button size="sm" onClick={submit} disabled={!valid}>
          {submitLabel ?? t("Let's go")}
          <ArrowRight className="ml-1.5 size-3.5" />
        </Button>
      </div>
    </InteractiveCardShell>
  );
}

function OnboardingPill({
  value,
  onChange,
  examples,
  suggestions,
  onPickSuggestion,
  onEnter,
  ariaLabel,
  autoFocus,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  examples: readonly string[];
  suggestions: OnboardingSuggestion[];
  onPickSuggestion: (suggestion: OnboardingSuggestion) => void;
  onEnter: () => void;
  ariaLabel: string;
  autoFocus?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  const reducedMotion = useReducedMotion();
  const listboxId = useId();
  const [dismissed, setDismissed] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [focused, setFocused] = useState(false);

  const rotating = value.length === 0 && !reducedMotion;
  useEffect(() => {
    if (!rotating) {
      return;
    }
    const timer = setInterval(
      () => setExampleIndex((index) => index + 1),
      EXAMPLE_ROTATE_MS,
    );
    return () => clearInterval(timer);
  }, [rotating]);
  const example = examples[exampleIndex % examples.length];

  const typed = value.trim().length > 0;
  const exactOnly =
    suggestions.length === 1 &&
    suggestions[0].value.toLowerCase() === value.trim().toLowerCase();
  const open =
    focused && typed && !dismissed && suggestions.length > 0 && !exactOnly;
  const activeIndex = highlighted < suggestions.length ? highlighted : -1;

  const pick = (suggestion: OnboardingSuggestion) => {
    onPickSuggestion(suggestion);
    setDismissed(true);
    setHighlighted(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && open) {
      e.preventDefault();
      setHighlighted((activeIndex + 1) % suggestions.length);
      return;
    }
    if (e.key === 'ArrowUp' && open) {
      e.preventDefault();
      setHighlighted(
        activeIndex <= 0 ? suggestions.length - 1 : activeIndex - 1,
      );
      return;
    }
    if (e.key === 'Escape' && open) {
      e.preventDefault();
      setDismissed(true);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (open && activeIndex >= 0) {
        pick(suggestions[activeIndex]);
        return;
      }
      onEnter();
    }
  };

  return (
    <span className="relative inline-grid max-w-full">
      <span
        aria-hidden
        className="invisible col-start-1 row-start-1 overflow-hidden whitespace-pre px-3.5 py-1.5"
      >
        {value || (rotating ? example : ariaLabel)}
      </span>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setDismissed(false);
          setHighlighted(-1);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          setHighlighted(-1);
        }}
        onKeyDown={handleKeyDown}
        placeholder={rotating ? '' : ariaLabel}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={
          open && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined
        }
        aria-autocomplete="list"
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
        className="col-start-1 row-start-1 w-full min-w-0 max-w-full rounded-lg bg-muted/60 px-3.5 py-1.5 text-foreground caret-primary ring-1 ring-transparent transition-[background-color,box-shadow] placeholder:text-muted-foreground/50 focus:bg-primary/5 focus:outline-none focus:ring-primary/35"
      />
      {rotating && (
        <span className="pointer-events-none absolute inset-0 flex items-center overflow-hidden px-3.5">
          <motion.span
            key={example}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="truncate font-normal text-muted-foreground/50"
          >
            {example}
          </motion.span>
        </span>
      )}
      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          onMouseDown={(e) => e.preventDefault()}
          className="absolute left-0 top-full z-20 mt-2 max-h-56 w-max min-w-full max-w-[19rem] overflow-y-auto rounded-xl border border-border bg-popover p-1 font-sans text-sm font-normal text-popover-foreground shadow-lg"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.value}-${suggestion.domain ?? ''}`}
              id={`${listboxId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
            >
              <button
                type="button"
                tabIndex={-1}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(suggestion);
                }}
                onMouseEnter={() => setHighlighted(index)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left',
                  index === activeIndex && 'bg-accent text-accent-foreground',
                )}
              >
                {suggestion.logo && (
                  <img
                    src={suggestion.logo}
                    alt=""
                    className="size-4 shrink-0 rounded-sm object-contain"
                  />
                )}
                <span className="truncate">{suggestion.value}</span>
                {suggestion.hint && (
                  <span className="ml-auto shrink-0 pl-3 text-xs text-muted-foreground">
                    {suggestion.hint}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </span>
  );
}

const EXAMPLE_ROTATE_MS = 3600;

const ROLE_EXAMPLES: readonly string[] = [
  'founder',
  'sales manager',
  'recruiter',
  'ops lead',
  'marketer',
  'software engineer',
];

const COMPANY_EXAMPLES: readonly string[] = [
  'Shopify',
  'a real-estate agency',
  'Notion',
  'an online store',
  'Airbnb',
  'a law firm',
  'HubSpot',
  'a dental clinic',
];

type OnboardingSuggestion = {
  value: string;
  hint?: string;
  domain?: string;
  logo?: string | null;
};

export type OnboardingAnswers = {
  role: string;
  company: string;
  companyDomain: string | null;
};
