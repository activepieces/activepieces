import { t } from 'i18next';
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Play,
  Plus,
  Plug,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ChecklistItem = {
  key: string;
  label: string;
  description: string;
  href?: string;
  external?: boolean;
};

const ITEMS: ChecklistItem[] = [
  {
    key: 'create-flow',
    label: 'Create your first workflow',
    description: 'Build an automation from scratch or a template.',
    href: '/flows?newFlow=true',
  },
  {
    key: 'connect-integration',
    label: 'Connect an integration',
    description: 'Link Slack, Shopify, HubSpot, or any of 80+ pieces.',
    href: '/integrations',
  },
  {
    key: 'explore-pieces',
    label: 'Explore the integrations catalogue',
    description: 'See what you can automate.',
    href: '/integrations',
  },
  {
    key: 'run-test',
    label: 'Run a test execution',
    description: 'Watch your workflow run and see the result.',
    href: '/runs',
  },
];

const STORAGE_KEY = 'synkra:onboarding:checklist:state';

function loadState(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function GetStartedChecklist() {
  const [state, setState] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setState(loadState());
    setDismissed(localStorage.getItem(`${STORAGE_KEY}:dismissed`) === '1');
  }, []);

  const toggle = (key: string) => {
    const next = { ...state, [key]: !state[key] };
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem(`${STORAGE_KEY}:dismissed`, '1');
  };

  const completedCount = Object.values(state).filter(Boolean).length;
  const total = ITEMS.length;

  if (dismissed || completedCount === total) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-white p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium">{t('Get started with Synkra Flow')}</h3>
          <p className="text-sm text-gray-11 mt-0.5">
            {t('{{done}} of {{total}} complete', { done: completedCount, total })}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={dismiss}
          className="size-7"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-gray-3 overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${(completedCount / total) * 100}%` }}
        />
      </div>

      {/* Items */}
      <div className="flex flex-col divide-y">
        {ITEMS.map((item) => {
          const done = state[item.key] ?? false;
          const content = (
            <div className="flex items-start gap-3 py-3 group">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  toggle(item.key);
                }}
                className="mt-0.5 shrink-0"
              >
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-green-10" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-8 group-hover:text-primary" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div
                  className={cn(
                    'text-sm font-medium',
                    done && 'line-through text-gray-9',
                  )}
                >
                  {t(item.label)}
                </div>
                <div className="text-xs text-gray-11 mt-0.5">
                  {t(item.description)}
                </div>
              </div>
              {item.href && (
                <ExternalLink className="h-4 w-4 text-gray-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
              )}
            </div>
          );

          if (item.href && !item.external) {
            return (
              <Link key={item.key} to={item.href} className="block">
                {content}
              </Link>
            );
          }
          return <div key={item.key}>{content}</div>;
        })}
      </div>
    </div>
  );
}
