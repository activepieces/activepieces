import { t } from 'i18next';
import { ChevronDown, Mail } from 'lucide-react';
import { useState } from 'react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Markdown } from '@/components/prompt-kit/markdown';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

import { EmailGroupHastNode } from '../../lib/email-group-marker';

import { parseEmail } from './email-preview';

export function EmailGroup({ node }: { node?: EmailGroupHastNode }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const emails = extractEmails(node);
  if (emails.length === 0) return null;

  return (
    <div className="my-2 overflow-hidden rounded-xl border bg-background">
      <div className="flex items-center gap-2 border-b border-border px-3.5 py-2">
        <Mail className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          {t('chatEmailCount', { count: emails.length })}
        </span>
      </div>
      <div className="divide-y divide-border">
        {emails.map((email, index) => (
          <EmailRow
            key={index}
            email={email}
            open={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </div>
  );
}

function EmailRow({
  email,
  open,
  onToggle,
}: {
  email: EmailItem;
  open: boolean;
  onToggle: () => void;
}) {
  const title = email.title || email.subject || t('Email');
  const showSubject = email.subject.length > 0 && email.subject !== title;
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-muted/40"
      >
        <Mail className="size-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <TextWithTooltip tooltipMessage={title}>
            <p className="text-xs font-medium text-foreground">{title}</p>
          </TextWithTooltip>
          {showSubject ? (
            <TextWithTooltip tooltipMessage={email.subject}>
              <p className="text-[11px] text-muted-foreground">
                {email.subject}
              </p>
            </TextWithTooltip>
          ) : null}
        </div>
        <ChevronDown
          className={cn(
            'size-3.5 shrink-0 text-muted-foreground/50 transition-transform duration-300',
            open && 'rotate-180',
          )}
        />
      </button>
      <Collapsible open={open}>
        <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
          <div className="px-3.5 pb-3 text-sm">
            <Markdown>{email.body}</Markdown>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function extractEmails(node: EmailGroupHastNode | undefined): EmailItem[] {
  if (!node?.children) return [];
  const emails: EmailItem[] = [];
  let pendingLabel = '';
  for (const child of node.children) {
    if (child.type !== 'element') continue;
    if (child.tagName === 'pre') {
      const code = child.children?.find(
        (entry) => entry.type === 'element' && entry.tagName === 'code',
      );
      const content = code ? collectText(code) : '';
      if (content.trim().length > 0) {
        const { subject, body } = parseEmail(content);
        emails.push({ title: pendingLabel, subject, body });
      }
      pendingLabel = '';
      continue;
    }
    if (LABEL_TAGS.has(child.tagName ?? '')) {
      pendingLabel = collectText(child).trim();
    }
  }
  return emails;
}

function collectText(node: EmailGroupHastNode): string {
  if (node.type === 'text') return node.value ?? '';
  if (!node.children) return '';
  return node.children.map(collectText).join('');
}

const LABEL_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

type EmailItem = { title: string; subject: string; body: string };
