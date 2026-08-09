import { ColorName, ProjectType } from '@activepieces/shared';
import { t } from 'i18next';
import {
  BookOpen,
  ChevronLeft,
  ExternalLink,
  KeyRound,
  Search,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AiProviderInfo } from '@/features/agents';
import { ApProjectDisplay } from '@/features/projects';
import { cn } from '@/lib/utils';

import { ModelFacts } from '../mock/fixtures';

export function ProviderDetail({
  keyName,
  info,
  down,
  usageDashboardUrl,
  monitorGuideUrl,
  models,
  projects,
  config,
  onConfigChange,
  onBack,
}: {
  keyName: string;
  info: AiProviderInfo;
  down?: boolean;
  usageDashboardUrl?: string;
  monitorGuideUrl?: string;
  models: ModelFacts[];
  projects: ProjectOption[];
  config: ProviderConfig;
  onConfigChange: (next: ProviderConfig) => void;
  onBack: () => void;
}) {
  const [modelSearch, setModelSearch] = useState('');
  const [activeCapabilities, setActiveCapabilities] = useState<Set<Capability>>(
    new Set(),
  );

  const query = modelSearch.trim().toLowerCase();
  const filteredModels = models.filter((model) => {
    const matchesSearch =
      query.length === 0 || model.name.toLowerCase().includes(query);
    const matchesCapabilities = [...activeCapabilities].every(
      (capability) => model[capability],
    );
    return matchesSearch && matchesCapabilities;
  });
  const allModelsEnabled =
    models.length > 0 &&
    models.every((model) => config.enabledModelIds.has(model.id));

  const toggleModel = (id: string, on: boolean) => {
    const next = new Set(config.enabledModelIds);
    if (on) {
      next.add(id);
    } else {
      next.delete(id);
    }
    onConfigChange({ ...config, enabledModelIds: next });
  };

  const toggleCapability = (capability: Capability) => {
    const next = new Set(activeCapabilities);
    if (next.has(capability)) {
      next.delete(capability);
    } else {
      next.add(capability);
    }
    setActiveCapabilities(next);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          {t('Providers')}
        </button>
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted/60">
            {info.logoUrl && (
              <img
                src={info.logoUrl}
                alt={info.name}
                className="size-6 object-contain"
              />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold tracking-tight leading-none">
              {keyName}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{info.name}</span>
              <span aria-hidden>·</span>
              <span className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    down ? 'bg-destructive' : 'bg-success-500',
                  )}
                />
                {down ? t('Unreachable') : t('Active')}
              </span>
              {usageDashboardUrl && (
                <a
                  href={usageDashboardUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                >
                  <ExternalLink className="size-3" />
                  {t('Usage dashboard')}
                </a>
              )}
              {monitorGuideUrl && (
                <a
                  href={monitorGuideUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                >
                  <BookOpen className="size-3" />
                  {t('Monitoring guide')}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
            <KeyRound className="size-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-none">{t('API key')}</p>
            <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
              sk-••••••••••••4f2a
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm">
          {t('Replace')}
        </Button>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-semibold tracking-tight">
              {t('Models')}
            </h2>
            <span className="text-sm text-muted-foreground tabular-nums">
              {config.enabledModelIds.size} {t('selected')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('Choose which models this provider offers across the platform.')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-52">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={modelSearch}
              onChange={(event) => setModelSearch(event.target.value)}
              placeholder={t('Search models')}
              className="pl-8"
              thin
            />
          </div>
          {CAPABILITY_FILTERS.map((filter) => (
            <FilterChip
              key={filter.key}
              label={filter.label}
              active={activeCapabilities.has(filter.key)}
              onClick={() => toggleCapability(filter.key)}
            />
          ))}
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            onClick={() =>
              onConfigChange({
                ...config,
                enabledModelIds: allModelsEnabled
                  ? new Set()
                  : new Set(models.map((model) => model.id)),
              })
            }
          >
            {allModelsEnabled ? t('Disable all') : t('Enable all')}
          </Button>
        </div>
        <div className="overflow-hidden rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t('Model')}</TableHead>
                <TableHead className="w-28">{t('Context')}</TableHead>
                <TableHead className="w-32">{t('Cost / 1M')}</TableHead>
                <TableHead className="w-24">{t('Speed')}</TableHead>
                <TableHead className="w-28 text-right">
                  {t('Enabled')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModels.map((model) => (
                <TableRow key={model.id} className="group">
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium">{model.name}</span>
                      {CAPABILITY_FILTERS.filter(
                        (filter) => model[filter.key],
                      ).map((filter) => (
                        <span
                          key={filter.key}
                          className="rounded-full bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground"
                        >
                          {filter.label}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {formatContext(model.contextWindow)}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    ${model.cost.input}/${model.cost.output}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {SPEED_LABELS[model.speed]}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a
                            href={model.detailsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t('View model details')}
                        </TooltipContent>
                      </Tooltip>
                      <Switch
                        checked={config.enabledModelIds.has(model.id)}
                        onCheckedChange={(checked) =>
                          toggleModel(model.id, checked)
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredModels.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {t('No models match your filters.')}
            </p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold tracking-tight">
            {t('Project access')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('Where this provider can be used.')}
          </p>
        </div>
        <RadioGroup
          value={config.scope}
          onValueChange={(value) =>
            onConfigChange({ ...config, scope: value as ProjectScope })
          }
          className="grid gap-2 sm:grid-cols-2"
        >
          <ScopeOption
            value="all"
            title={t('All projects')}
            description={t('Included in new projects automatically')}
            active={config.scope === 'all'}
          />
          <ScopeOption
            value="selected"
            title={t('Only selected projects')}
            description={t('Pick which projects can use it')}
            active={config.scope === 'selected'}
          />
        </RadioGroup>
        {config.scope === 'selected' && (
          <ProjectMultiSelect
            projects={projects}
            selectedProjectIds={config.selectedProjectIds}
            onChange={(next) =>
              onConfigChange({ ...config, selectedProjectIds: next })
            }
          />
        )}
      </section>

      <div>
        <Button
          variant="ghost"
          className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" />
          {t('Remove key')}
        </Button>
      </div>
    </div>
  );
}

function ProjectMultiSelect({
  projects,
  selectedProjectIds,
  onChange,
}: {
  projects: ProjectOption[];
  selectedProjectIds: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();
  const filtered = projects.filter(
    (project) =>
      query.length === 0 || project.name.toLowerCase().includes(query),
  );

  const toggle = (id: string) => {
    const next = new Set(selectedProjectIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('Search projects')}
            className="pl-8"
            thin
          />
        </div>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {selectedProjectIds.size} {t('selected')}
        </span>
      </div>
      <div className="flex max-h-96 flex-col overflow-auto">
        {filtered.map((project) => (
          <label
            key={project.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/40"
          >
            <Checkbox
              checked={selectedProjectIds.has(project.id)}
              onCheckedChange={() => toggle(project.id)}
            />
            <ApProjectDisplay
              title={project.name}
              icon={{ color: project.color }}
              projectType={project.type}
            />
          </label>
        ))}
        {filtered.length === 0 && (
          <span className="px-2 py-8 text-center text-sm text-muted-foreground">
            {t('No projects found.')}
          </span>
        )}
      </div>
    </div>
  );
}

function ScopeOption({
  value,
  title,
  description,
  active,
}: {
  value: ProjectScope;
  title: string;
  description: string;
  active: boolean;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
        active ? 'border-primary/40 bg-primary/5' : 'border-border/60',
      )}
    >
      <RadioGroupItem value={value} className="mt-0.5" />
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    </label>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-2.5 py-1 text-xs transition-colors',
        active
          ? 'border-primary/30 bg-primary/10 text-primary'
          : 'border-border/60 text-muted-foreground hover:bg-muted/60',
      )}
    >
      {label}
    </button>
  );
}

function formatContext(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${tokens / 1_000_000}M`;
  }
  if (tokens >= 1_000) {
    return `${Math.round(tokens / 1_000)}K`;
  }
  return `${tokens}`;
}

type Capability = 'vision' | 'embeddings' | 'imageGeneration';

type ProjectScope = 'all' | 'selected';

type ProjectOption = {
  id: string;
  name: string;
  color: ColorName;
  type: ProjectType;
};

type ProviderConfig = {
  enabledModelIds: Set<string>;
  scope: ProjectScope;
  selectedProjectIds: Set<string>;
};

const CAPABILITY_FILTERS: { key: Capability; label: string }[] = [
  { key: 'vision', label: t('Vision') },
  { key: 'embeddings', label: t('Embeddings') },
  { key: 'imageGeneration', label: t('Image') },
];

const SPEED_LABELS: Record<ModelFacts['speed'], string> = {
  fast: t('Fast'),
  medium: t('Medium'),
  slow: t('Slow'),
};

export type { ProviderConfig, ProjectScope, ProjectOption };
