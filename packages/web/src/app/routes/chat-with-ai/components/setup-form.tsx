import {
  ConnectionOption,
  SetupFormField,
  SetupFormFieldOption,
  SetupFormFieldType,
  SetupFormInput,
  SetupFormOutput,
  SetupFormSection,
  spreadIfDefined,
} from '@activepieces/shared';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  Check,
  ChevronRight,
  FolderClosed,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { MultiSelectPieceProperty } from '@/components/custom/multi-select-piece-property';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { chatApi } from '@/features/chat/lib/chat-api';
import { piecesHooks } from '@/features/pieces';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import {
  isConnectionHealthy,
  normalizePieceName,
} from '../lib/message-parsers';
import { useConversationId } from '../lib/use-conversation-id';

export function SetupForm({ input, onSubmit, onDismiss }: SetupFormProps) {
  const conversationId = useConversationId();
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [projectId, setProjectId] = useState<string | undefined>(
    input.project?.defaultProjectId ?? input.project?.suggestedProjects[0]?.id,
  );
  const [connectionOverrides, setConnectionOverrides] = useState<
    Record<number, ConnectionChoice>
  >({});
  const sectionValues = useRef<Map<number, Record<string, unknown>>>(new Map());

  const effectiveProjectId =
    projectId ?? authenticationSession.getProjectId() ?? '';

  const connectionQueries = useQueries({
    queries: input.sections.map((section) => {
      const pieceName = normalizePieceName(section.piece);
      return {
        queryKey: ['chat-setup-form-connections', conversationId, pieceName],
        queryFn: () =>
          chatApi.getPickerConnections({
            conversationId: conversationId ?? '',
            pieceName,
          }),
        enabled: section.requiresConnection && !!conversationId,
        staleTime: 30_000,
      };
    }),
  });

  function projectConnections(sectionIndex: number): ConnectionOption[] {
    const all = connectionQueries[sectionIndex]?.data ?? [];
    return all.filter((c) => c.projectId === effectiveProjectId);
  }

  function effectiveConnection(sectionIndex: number): ConnectionChoice | null {
    const override = connectionOverrides[sectionIndex];
    if (override) return override;
    return pickDefaultConnection({
      connections: projectConnections(sectionIndex),
      recommendedExternalId:
        input.sections[sectionIndex].recommendedConnectionExternalId,
    });
  }

  function sectionStatus(sectionIndex: number): StepStatus {
    const section = input.sections[sectionIndex];
    if (!section.requiresConnection) return 'ready';
    if (connectionQueries[sectionIndex]?.isLoading) return 'loading';
    return effectiveConnection(sectionIndex) ? 'ready' : 'needs-account';
  }

  const totalSteps = input.sections.length;
  const isLastStep = activeStep === totalSteps - 1;

  function handleProjectChange(nextProjectId: string) {
    setProjectId(nextProjectId);
    setConnectionOverrides({});
    sectionValues.current.clear();
  }

  function handleSubmit() {
    if (submitted) return;
    setSubmitted(true);
    const payload: SetupFormOutput = {
      projectId,
      sections: input.sections.map((section, i) => {
        const connection = effectiveConnection(i);
        return {
          piece: section.piece,
          actionOrTriggerName: section.actionOrTriggerName,
          connectionExternalId: connection?.externalId,
          connectionProjectId: connection?.projectId,
          connectionLabel: connection?.label,
          fields:
            sectionValues.current.get(i) ?? initialFieldValues(section.fields),
        };
      }),
    };
    onSubmit(payload);
  }

  if (submitted) {
    return (
      <motion.div
        className="my-3 flex items-center gap-2 text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Check className="size-4 text-success" />
        <span>{t('Setup submitted')}</span>
      </motion.div>
    );
  }

  const projectOptions = input.project?.suggestedProjects ?? [];

  return (
    <motion.div
      className="rounded-2xl border border-border/60 bg-background shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] dark:bg-neutral-900 dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)] overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.35, 0, 0.25, 1] }}
    >
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="size-4 text-primary shrink-0" />
            <h3 className="text-base font-semibold truncate tracking-tight">
              {input.title ?? t('Set up your automation')}
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {projectOptions.length > 1 && (
              <Select value={projectId} onValueChange={handleProjectChange}>
                <SelectTrigger className="h-8 w-auto gap-1.5 text-xs">
                  <FolderClosed className="size-3.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder={t('Select a project')} />
                </SelectTrigger>
                <SelectContent>
                  {projectOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onDismiss}
                aria-label={t('Close')}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>
        <SetupStepper
          sections={input.sections}
          statuses={input.sections.map((_, i) => sectionStatus(i))}
          activeStep={activeStep}
          onSelect={setActiveStep}
        />
      </div>

      <div className="max-h-[55vh] overflow-y-auto px-5 py-4">
        {input.sections.map((section, i) => {
          const connection = effectiveConnection(i);
          return (
            <div
              key={`${section.piece}-${section.actionOrTriggerName}-${i}`}
              className={cn(i !== activeStep && 'hidden')}
            >
              <StepCard
                key={effectiveProjectId}
                section={section}
                status={sectionStatus(i)}
                connections={projectConnections(i)}
                connection={connection}
                conversationId={conversationId}
                projectId={effectiveProjectId}
                onSelectConnection={(choice) =>
                  setConnectionOverrides((prev) => ({ ...prev, [i]: choice }))
                }
                onConnectionCreated={(choice) => {
                  setConnectionOverrides((prev) => ({ ...prev, [i]: choice }));
                  void queryClient.invalidateQueries({
                    queryKey: [
                      'chat-setup-form-connections',
                      conversationId,
                      normalizePieceName(section.piece),
                    ],
                  });
                }}
                onValuesChange={(values) => {
                  sectionValues.current.set(i, values);
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 px-5 pb-4 pt-1">
        <span className="text-xs text-muted-foreground tabular-nums">
          {t('Step {current} of {total}', {
            current: activeStep + 1,
            total: totalSteps,
          })}
        </span>
        <div className="flex items-center gap-2">
          {activeStep > 0 && (
            <Button
              variant="ghost"
              onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
            >
              {t('Back')}
            </Button>
          )}
          {isLastStep ? (
            <Button onClick={handleSubmit}>{t('Build automation')}</Button>
          ) : (
            <Button
              onClick={() =>
                setActiveStep((s) => Math.min(totalSteps - 1, s + 1))
              }
            >
              {t('Next')}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function SetupFormSummary({ input, output }: SetupFormSummaryProps) {
  if (!output || output['dismissed'] === true) return null;
  const submittedProjectId =
    typeof output['projectId'] === 'string' ? output['projectId'] : undefined;
  const projectName = input.project?.suggestedProjects.find(
    (p) => p.id === submittedProjectId,
  )?.name;
  return (
    <motion.div
      className="rounded-xl border bg-background overflow-hidden my-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="px-4 py-3 flex items-center gap-2 border-b bg-muted/30">
        <div className="bg-success/15 rounded-full p-1">
          <Check className="h-3 w-3 text-success" />
        </div>
        <span className="text-sm font-medium">{t('Setup complete')}</span>
        {projectName && (
          <span className="text-xs text-muted-foreground ms-auto flex items-center gap-1">
            <FolderClosed className="size-3" />
            {projectName}
          </span>
        )}
      </div>
      <div className="px-4 py-3 space-y-2">
        {input.sections.map((section, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <PieceIconWithPieceName
              pieceName={normalizePieceName(section.piece)}
              size="sm"
              border={false}
              showTooltip={false}
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">
                {section.stepTitle}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {section.displayName}
                {' · '}
                {t('fieldsConfiguredCount', {
                  count: section.fields.length,
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function SetupStepper({
  sections,
  statuses,
  activeStep,
  onSelect,
}: {
  sections: SetupFormSection[];
  statuses: StepStatus[];
  activeStep: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap pt-3">
      {sections.map((section, i) => {
        const active = i === activeStep;
        const status = statuses[i];
        return (
          <div key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronRight className="size-3.5 text-muted-foreground/40 shrink-0" />
            )}
            <button
              type="button"
              onClick={() => onSelect(i)}
              className={cn(
                'flex items-center gap-1.5 rounded-md ps-1.5 pe-2.5 py-1 transition-colors duration-150',
                active ? 'bg-muted' : 'hover:bg-muted/50',
              )}
            >
              <PieceIconWithPieceName
                pieceName={normalizePieceName(section.piece)}
                size="xs"
                border={false}
                showTooltip={false}
              />
              <span
                className={cn(
                  'text-xs font-medium truncate max-w-[140px]',
                  !active && 'text-muted-foreground',
                )}
              >
                {section.displayName}
              </span>
              {status === 'needs-account' && (
                <span className="size-1.5 rounded-full bg-warning shrink-0" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function initialFieldValues(fields: SetupFormField[]): Record<string, unknown> {
  return fields.reduce<Record<string, unknown>>(
    (acc, field) => ({
      ...acc,
      ...spreadIfDefined(field.name, field.defaultValue),
    }),
    {},
  );
}

function pickDefaultConnection({
  connections,
  recommendedExternalId,
}: {
  connections: ConnectionOption[];
  recommendedExternalId: string | undefined;
}): ConnectionChoice | null {
  const recommended = connections.find(
    (c) =>
      c.externalId === recommendedExternalId && isConnectionHealthy(c.status),
  );
  const fallback = connections.find((c) => isConnectionHealthy(c.status));
  const chosen = recommended ?? fallback;
  if (!chosen) return null;
  return {
    externalId: chosen.externalId,
    label: chosen.label,
    projectId: chosen.projectId,
  };
}

function StepStatusChip({ status }: { status: StepStatus }) {
  if (status === 'loading') {
    return <Skeleton className="h-4 w-16 rounded-full" />;
  }
  if (status === 'needs-account') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-warning shrink-0">
        <span className="size-1.5 rounded-full bg-warning" />
        {t('Needs account')}
      </span>
    );
  }
  return null;
}

function StepCard({
  section,
  status,
  connections,
  connection,
  conversationId,
  projectId,
  onSelectConnection,
  onConnectionCreated,
  onValuesChange,
}: StepCardProps) {
  const pieceName = normalizePieceName(section.piece);
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    initialFieldValues(section.fields),
  );
  const [dynamicOptions, setDynamicOptions] = useState<
    Record<string, SetupFormFieldOption[]>
  >({});
  const [loadingFields, setLoadingFields] = useState<Set<string>>(new Set());
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const { pieceModel } = piecesHooks.usePiece({ name: pieceName });
  const isLoadingConnections = status === 'loading';

  function updateValues(nextValues: Record<string, unknown>) {
    setValues(nextValues);
    onValuesChange(nextValues);
  }

  function getFieldOptions(field: SetupFormField): SetupFormFieldOption[] {
    return dynamicOptions[field.name] ?? field.options ?? [];
  }

  function refreshersSatisfied(
    field: SetupFormField,
    currentValues: Record<string, unknown>,
  ): boolean {
    return (field.refreshers ?? []).every(
      (r) => r === 'auth' || currentValues[r] !== undefined,
    );
  }

  async function resolveFields({
    fields,
    currentValues,
  }: {
    fields: SetupFormField[];
    currentValues: Record<string, unknown>;
  }) {
    if (!conversationId || fields.length === 0) return;
    setLoadingFields((prev) => {
      const next = new Set(prev);
      fields.forEach((f) => next.add(f.name));
      return next;
    });
    await Promise.all(
      fields.map(async (field) => {
        try {
          const result = await chatApi.resolveSetupFormOptions({
            conversationId,
            request: {
              pieceName,
              actionOrTriggerName: section.actionOrTriggerName,
              type: section.role,
              propertyName: field.name,
              connectionExternalId: connection?.externalId,
              projectId,
              input: currentValues,
            },
          });
          setDynamicOptions((prev) => ({
            ...prev,
            [field.name]: result.options,
          }));
        } catch {
          setDynamicOptions((prev) => ({ ...prev, [field.name]: [] }));
        } finally {
          setLoadingFields((prev) => {
            const next = new Set(prev);
            next.delete(field.name);
            return next;
          });
        }
      }),
    );
  }

  function handleValueChange(field: SetupFormField, value: unknown) {
    const nextValues = { ...values, [field.name]: value };
    const dependents = section.fields.filter(
      (f) => f.dynamic && f.refreshers?.includes(field.name),
    );
    const clearedValues = dependents.reduce(
      (acc, f) => ({ ...acc, [f.name]: undefined }),
      nextValues,
    );
    updateValues(clearedValues);
    const resolvableDependents = dependents.filter((f) =>
      refreshersSatisfied(f, clearedValues),
    );
    if (resolvableDependents.length > 0) {
      void resolveFields({
        fields: resolvableDependents,
        currentValues: clearedValues,
      });
    }
  }

  const lastResolvedConnection = useRef<string | null>(null);
  useEffect(() => {
    if (!conversationId) return;
    if (section.requiresConnection && !connection) return;
    const connectionKey = connection?.externalId ?? 'none';
    if (lastResolvedConnection.current === connectionKey) return;
    const isFirstResolve = lastResolvedConnection.current === null;
    lastResolvedConnection.current = connectionKey;
    const dynamicFields = section.fields.filter((f) => f.dynamic);
    let currentValues = values;
    if (!isFirstResolve) {
      currentValues = dynamicFields.reduce(
        (acc, f) => ({ ...acc, [f.name]: undefined }),
        values,
      );
      updateValues(currentValues);
    }
    const fieldsToResolve = dynamicFields.filter(
      (f) =>
        refreshersSatisfied(f, currentValues) &&
        (!isFirstResolve || (f.options ?? []).length === 0),
    );
    if (fieldsToResolve.length === 0) return;
    void resolveFields({ fields: fieldsToResolve, currentValues });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, connection?.externalId]);

  const hasNoConnections =
    section.requiresConnection && !isLoadingConnections && !connection;
  const fieldsDisabled = section.requiresConnection && !connection;

  return (
    <div>
      <div className="flex items-center gap-3 pb-5">
        <PieceIconWithPieceName
          pieceName={pieceName}
          size="md"
          border={false}
          showTooltip={false}
        />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">
            {section.stepTitle}
          </div>
          <div className="text-xs text-muted-foreground">
            {section.role === 'trigger' ? t('Trigger') : t('Action')}
          </div>
        </div>
        <StepStatusChip status={status} />
      </div>

      <div className="space-y-5">
        {section.requiresConnection && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              {t('Account')}
            </Label>
            {isLoadingConnections ? (
              <Skeleton className="h-9 w-full rounded-md" />
            ) : hasNoConnections ? (
              <div className="flex items-center justify-between gap-3 rounded-md bg-muted/50 px-3 py-2">
                <span className="text-xs text-muted-foreground">
                  {t('No {name} connections in this project yet', {
                    name: section.displayName,
                  })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  disabled={!pieceModel}
                  onClick={() => setConnectDialogOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t('Connect')}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Select
                  value={connection?.externalId ?? ''}
                  onValueChange={(externalId) => {
                    const conn = connections.find(
                      (c) => c.externalId === externalId,
                    );
                    if (conn) {
                      onSelectConnection({
                        externalId: conn.externalId,
                        label: conn.label,
                        projectId: conn.projectId,
                      });
                    }
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={t('Select an account')} />
                  </SelectTrigger>
                  <SelectContent>
                    {connections.map((conn) => (
                      <SelectItem
                        key={conn.externalId}
                        value={conn.externalId}
                        disabled={!isConnectionHealthy(conn.status)}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              'size-1.5 rounded-full',
                              isConnectionHealthy(conn.status)
                                ? 'bg-success'
                                : 'bg-destructive',
                            )}
                          />
                          {conn.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  disabled={!pieceModel}
                  onClick={() => setConnectDialogOpen(true)}
                  aria-label={t('Connect a new account')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {section.fields.map((field) => (
          <FieldRenderer
            key={field.name}
            field={field}
            value={values[field.name]}
            options={getFieldOptions(field)}
            loading={loadingFields.has(field.name)}
            disabled={fieldsDisabled}
            onChange={(value) => handleValueChange(field, value)}
          />
        ))}
      </div>

      {pieceModel && (
        <CreateOrEditConnectionDialog
          piece={pieceModel}
          open={connectDialogOpen}
          projectId={projectId}
          setOpen={(open, createdConnection) => {
            setConnectDialogOpen(open);
            if (createdConnection) {
              onConnectionCreated({
                externalId: createdConnection.externalId,
                label: createdConnection.displayName,
                projectId,
              });
            }
          }}
          reconnectConnection={null}
          isGlobalConnection={false}
        />
      )}
    </div>
  );
}

function optionKey(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function isSuggestedValue({
  field,
  value,
}: {
  field: SetupFormField;
  value: unknown;
}): boolean {
  if (field.defaultValue === undefined || value === undefined) return false;
  return optionKey(value) === optionKey(field.defaultValue);
}

function SuggestedMarker() {
  return (
    <span className="flex items-center gap-1 text-xs text-primary font-normal">
      <Sparkles className="size-3" />
      {t('Suggested')}
    </span>
  );
}

function FieldRenderer({
  field,
  value,
  options,
  loading,
  disabled,
  onChange,
}: {
  field: SetupFormField;
  value: unknown;
  options: SetupFormFieldOption[];
  loading: boolean;
  disabled: boolean;
  onChange: (value: unknown) => void;
}) {
  const suggested = isSuggestedValue({ field, value });
  const labelRow = (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-xs font-medium text-muted-foreground">
        {field.displayName}
      </Label>
      {suggested && <SuggestedMarker />}
    </div>
  );

  switch (field.type) {
    case SetupFormFieldType.CHECKBOX:
      return (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={value === true}
              disabled={disabled}
              onCheckedChange={(checked) => onChange(checked === true)}
            />
            <Label className="text-sm font-normal">{field.displayName}</Label>
          </div>
          {suggested && <SuggestedMarker />}
        </div>
      );
    case SetupFormFieldType.LONG_TEXT:
      return (
        <div className="space-y-1.5">
          {labelRow}
          <Textarea
            value={typeof value === 'string' ? value : ''}
            placeholder={field.placeholder}
            disabled={disabled}
            rows={3}
            onChange={(e) => onChange(e.target.value)}
          />
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
      );
    case SetupFormFieldType.DROPDOWN:
      return (
        <div className="space-y-1.5">
          {labelRow}
          <SearchableSelect
            options={options.map((o) => ({ label: o.label, value: o.value }))}
            value={value ?? undefined}
            onChange={(v) => onChange(v)}
            placeholder={field.placeholder ?? t('Select an option')}
            disabled={disabled}
            loading={loading}
          />
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
      );
    case SetupFormFieldType.MULTI_DROPDOWN:
      return (
        <div className="space-y-1.5">
          {labelRow}
          <MultiSelectPieceProperty
            options={options.map((o) => ({ label: o.label, value: o.value }))}
            initialValues={Array.isArray(value) ? value : undefined}
            onChange={(v) => onChange(v ?? [])}
            placeholder={field.placeholder ?? t('Select options')}
            disabled={disabled}
            loading={loading}
          />
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
      );
    case SetupFormFieldType.CHOICE:
      return (
        <div className="space-y-1.5">
          {labelRow}
          <div className="flex flex-wrap gap-1.5">
            {options.map((option) => {
              const selected = optionKey(value) === optionKey(option.value);
              return (
                <Button
                  key={optionKey(option.value)}
                  type="button"
                  variant={selected ? 'default' : 'outline'}
                  size="sm"
                  disabled={disabled}
                  onClick={() => onChange(option.value)}
                >
                  {option.label}
                </Button>
              );
            })}
          </div>
        </div>
      );
    case SetupFormFieldType.TEXT:
    default:
      return (
        <div className="space-y-1.5">
          {labelRow}
          <Input
            value={typeof value === 'string' ? value : ''}
            placeholder={field.placeholder}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
          />
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
      );
  }
}

type StepStatus = 'ready' | 'needs-account' | 'loading';

type ConnectionChoice = {
  externalId: string;
  label: string;
  projectId: string;
};

type StepCardProps = {
  section: SetupFormSection;
  status: StepStatus;
  connections: ConnectionOption[];
  connection: ConnectionChoice | null;
  conversationId: string | undefined;
  projectId: string;
  onSelectConnection: (choice: ConnectionChoice) => void;
  onConnectionCreated: (choice: ConnectionChoice) => void;
  onValuesChange: (values: Record<string, unknown>) => void;
};

type SetupFormProps = {
  input: SetupFormInput;
  onSubmit: (payload: SetupFormOutput) => void;
  onDismiss?: () => void;
};

type SetupFormSummaryProps = {
  input: SetupFormInput;
  output: Record<string, unknown> | undefined;
};
