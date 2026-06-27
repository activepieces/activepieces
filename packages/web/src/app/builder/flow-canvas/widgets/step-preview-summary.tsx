import { isNil } from '@activepieces/core-utils';
import { PieceMetadataModel } from '@activepieces/pieces-framework';
import {
  BranchExecutionType,
  FlowActionType,
  FlowTriggerType,
  Step,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ReactNode } from 'react';

import { stepPropertiesSnapshotUtils } from '@/app/builder/data-display/build-step-properties-snapshot';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PieceIcon, stepsHooks } from '@/features/pieces';

// Read-only, printed summary of a step's configured values shown inside the docked
// Stage preview card. It never mounts an editable form — every value is rendered as
// plain text so the card opens instantly and stays compact. Editing happens in the
// full sidebar via the card's "Edit settings" button.
export const StepPreviewSummary = ({
  step,
  pieceModel,
}: {
  step: Step;
  pieceModel: PieceMetadataModel | undefined;
}) => {
  const { stepMetadata } = stepsHooks.useStepMetadata({ step });
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 px-4 py-3">
        <PieceIcon
          logoUrl={stepMetadata?.logoUrl}
          displayName={stepMetadata?.displayName}
          showTooltip={false}
          border={false}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <TextWithTooltip tooltipMessage={step.displayName}>
            <p className="truncate text-sm font-medium">{step.displayName}</p>
          </TextWithTooltip>
          {stepMetadata?.actionOrTriggerOrAgentDisplayName && (
            <p className="truncate text-xs text-muted-foreground">
              {stepMetadata.actionOrTriggerOrAgentDisplayName}
            </p>
          )}
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="px-4 pb-4 pt-1">
          <StepPreviewBody step={step} pieceModel={pieceModel} />
        </div>
      </ScrollArea>
    </div>
  );
};

const StepPreviewBody = ({
  step,
  pieceModel,
}: {
  step: Step;
  pieceModel: PieceMetadataModel | undefined;
}) => {
  switch (step.type) {
    case FlowActionType.PIECE:
      return (
        <PiecePreview
          stepKind="action"
          pieceModel={pieceModel}
          stepName={step.settings.actionName}
          input={step.settings.input}
        />
      );
    case FlowTriggerType.PIECE:
      return (
        <PiecePreview
          stepKind="trigger"
          pieceModel={pieceModel}
          stepName={step.settings.triggerName}
          input={step.settings.input}
        />
      );
    case FlowActionType.CODE:
      return (
        <CodePreview
          input={step.settings.input}
          code={step.settings.sourceCode?.code}
        />
      );
    case FlowActionType.LOOP_ON_ITEMS:
      return (
        <SummaryList>
          <SummaryRow label={t('Items')}>
            <PreviewValue value={step.settings.items} />
          </SummaryRow>
        </SummaryList>
      );
    case FlowActionType.ROUTER:
      return <RouterPreview branches={step.settings.branches} />;
    case FlowTriggerType.EMPTY:
      return <EmptyState text={t('No trigger selected')} />;
    default:
      return <EmptyState text={t('No configuration to preview')} />;
  }
};

const PiecePreview = ({
  pieceModel,
  stepKind,
  stepName,
  input,
}: {
  pieceModel: PieceMetadataModel | undefined;
  stepKind: 'action' | 'trigger';
  stepName: string | undefined;
  input: Record<string, unknown> | undefined;
}) => {
  if (isNil(pieceModel)) {
    return <EmptyState text={t('Loading')} />;
  }
  const connectionName = extractConnectionName(input?.['auth']);
  const properties = stepPropertiesSnapshotUtils.build({
    pieceModel,
    stepKind,
    stepName,
    input,
  });
  if (isNil(connectionName) && properties.length === 0) {
    return <EmptyState text={t('No configuration to preview')} />;
  }
  return (
    <SummaryList>
      {!isNil(pieceModel.auth) && (
        <SummaryRow label={t('Connection')} required>
          {isNil(connectionName) ? (
            <NotSet />
          ) : (
            <span style={{ wordBreak: 'break-word' }}>{connectionName}</span>
          )}
        </SummaryRow>
      )}
      {properties.map((property) => (
        <SummaryRow
          key={property.name}
          label={property.displayName ?? property.name}
          required={property.required}
        >
          <PreviewValue type={property.type} value={property.currentValue} />
        </SummaryRow>
      ))}
    </SummaryList>
  );
};

const CodePreview = ({
  input,
  code,
}: {
  input: Record<string, unknown> | undefined;
  code: string | undefined;
}) => {
  const inputEntries = Object.entries(input ?? {});
  return (
    <div className="flex flex-col gap-3">
      {inputEntries.length > 0 && (
        <SummaryList>
          {inputEntries.map(([key, value]) => (
            <SummaryRow key={key} label={key}>
              <PreviewValue value={value} />
            </SummaryRow>
          ))}
        </SummaryList>
      )}
      {!isNil(code) && code.trim().length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            {t('Code')}
          </p>
          <pre className="max-h-48 overflow-hidden whitespace-pre-wrap rounded-md bg-muted p-2 font-mono text-xs text-foreground">
            {truncateCode(code)}
          </pre>
        </div>
      )}
      {inputEntries.length === 0 &&
        (isNil(code) || code.trim().length === 0) && (
          <EmptyState text={t('No configuration to preview')} />
        )}
    </div>
  );
};

const RouterPreview = ({
  branches,
}: {
  branches:
    | { branchName: string; branchType: BranchExecutionType }[]
    | undefined;
}) => {
  if (isNil(branches) || branches.length === 0) {
    return <EmptyState text={t('No branches configured')} />;
  }
  return (
    <SummaryList>
      {branches.map((branch, index) => (
        <SummaryRow
          key={`${branch.branchName}-${index}`}
          label={branch.branchName}
        >
          <span className="text-muted-foreground">
            {branch.branchType === BranchExecutionType.FALLBACK
              ? t('Otherwise')
              : t('Conditional')}
          </span>
        </SummaryRow>
      ))}
    </SummaryList>
  );
};

const SummaryList = ({ children }: { children: ReactNode }) => (
  <dl className="flex flex-col divide-y divide-border">{children}</dl>
);

const SummaryRow = ({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) => (
  <div className="grid grid-cols-[minmax(0,38%)_1fr] items-start gap-x-3 py-2">
    <dt className="flex items-start gap-0.5 text-xs font-medium text-muted-foreground [overflow-wrap:anywhere]">
      <span>{label}</span>
      {required && <span className="text-destructive">*</span>}
    </dt>
    <dd className="text-sm leading-relaxed text-foreground [overflow-wrap:anywhere]">
      {children}
    </dd>
  </div>
);

const PreviewValue = ({ type, value }: { type?: string; value: unknown }) => {
  const formatted = formatPreviewValue({ type, value });
  if (formatted.isEmpty) {
    return <NotSet />;
  }
  return <span className="whitespace-pre-wrap">{formatted.text}</span>;
};

const NotSet = () => (
  <span className="italic text-muted-foreground">{t('Not set')}</span>
);

const EmptyState = ({ text }: { text: string }) => (
  <p className="py-2 text-sm italic text-muted-foreground">{text}</p>
);

const CONNECTION_REGEX = /\{\{connections\['(.*?)'\]\}\}/;
const MAX_CODE_LINES = 40;
const SECRET_MASK = '••••••••';

function extractConnectionName(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const match = value.match(CONNECTION_REGEX);
  return match?.[1] ?? (value.trim().length > 0 ? value : undefined);
}

function truncateCode(code: string): string {
  const lines = code.split('\n');
  if (lines.length <= MAX_CODE_LINES) {
    return code;
  }
  return `${lines.slice(0, MAX_CODE_LINES).join('\n')}\n…`;
}

function formatPreviewValue({
  type,
  value,
}: {
  type?: string;
  value: unknown;
}): { isEmpty: boolean; text: string } {
  if (isNil(value) || value === '') {
    return { isEmpty: true, text: '' };
  }
  if (type === 'SECRET_TEXT') {
    return { isEmpty: false, text: SECRET_MASK };
  }
  if (typeof value === 'boolean') {
    return { isEmpty: false, text: value ? t('Yes') : t('No') };
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { isEmpty: true, text: '' };
    }
    return {
      isEmpty: false,
      text: value
        .map((item) =>
          typeof item === 'object' && !isNil(item)
            ? JSON.stringify(item)
            : String(item),
        )
        .join(', '),
    };
  }
  if (typeof value === 'object' && value !== null) {
    if (Object.keys(value).length === 0) {
      return { isEmpty: true, text: '' };
    }
    return { isEmpty: false, text: JSON.stringify(value) };
  }
  return { isEmpty: false, text: String(value) };
}
