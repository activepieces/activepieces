import { t } from 'i18next';
import { Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { AutomationProposal } from '../lib/message-parsers';

export function AutomationProposalCard({
  proposal,
  onBuild,
}: {
  proposal: AutomationProposal;
  onBuild: () => void;
}) {
  return (
    <div className="rounded-xl border bg-background shadow-sm overflow-hidden my-2">
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 shrink-0">
            <Zap className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">{proposal.title}</h3>
            {proposal.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {proposal.description}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1.5 ml-12">
          {proposal.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-xs font-medium text-muted-foreground bg-muted rounded-full h-5 w-5 flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-foreground/80">{step}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t px-4 py-3 bg-muted/30">
        <Button size="sm" className="gap-1.5" onClick={onBuild}>
          <Zap className="h-3.5 w-3.5" />
          {t('Build this automation')}
        </Button>
      </div>
    </div>
  );
}
