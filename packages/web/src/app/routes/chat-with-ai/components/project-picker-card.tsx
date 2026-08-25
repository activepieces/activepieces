import { ProjectType } from '@activepieces/shared';
import { t } from 'i18next';
import { AlignJustify } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useId, useMemo, useState } from 'react';

import { SearchInput } from '@/components/custom/search-input';
import {
  ApProjectDisplay,
  getProjectName,
  projectCollectionUtils,
} from '@/features/projects';
import { userHooks } from '@/hooks/user-hooks';

import { ProjectPickerData } from '../lib/message-parsers';

import {
  AnsweredQuestionsCard,
  ChatAnswerInputRow,
  ChatCard,
  ChatCardHeader,
  ChatOptionBadge,
  ChatOptionRow,
} from './chat-card-primitives';

const MAX_COLLAPSED = 3;

const VIEW_TRANSITION = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
  transition: { duration: 0.2 },
};

export function ProjectPickerCard({
  picker,
  onResolve,
  onDismiss,
  isInteractive = true,
  selectedProjectId,
  selectedProjectName,
}: ProjectPickerCardProps) {
  const { data: allProjects } = projectCollectionUtils.useAll();
  const { data: currentUser } = userHooks.useCurrentUser();
  const projects = useMemo(() => {
    const all = allProjects ?? [];
    if (!currentUser) return all;
    return all.filter(
      (p) => p.type !== ProjectType.PERSONAL || p.ownerId === currentUser.id,
    );
  }, [allProjects, currentUser]);

  const [selected, setSelected] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'all'>('list');
  const [search, setSearch] = useState('');
  const [answer, setAnswer] = useState('');
  const fieldId = useId();

  const suggestedProjects = picker.suggestedProjects ?? [];
  const title = picker.question ?? t('Which project should I work in?');

  const accessibleSuggested = useMemo(
    () =>
      (picker.suggestedProjects ?? [])
        .map((s) => projects.find((p) => p.id === s.id))
        .filter((p): p is ProjectItem => p !== undefined),
    [picker.suggestedProjects, projects],
  );
  const collapsedSuggested = accessibleSuggested.slice(0, MAX_COLLAPSED);
  const hasMore = projects.length > collapsedSuggested.length;
  const showAll = view === 'all' || accessibleSuggested.length === 0;

  function handleSelect(projectId: string, name: string) {
    setSelected(projectId);
    onResolve({ projectId, projectName: name });
  }

  function handleTyped() {
    const value = answer.trim();
    if (!value) return;
    setTypedAnswer(value);
    onResolve({ projectName: value });
  }

  if (selected || typedAnswer || !isInteractive) {
    const projectId = selected ?? selectedProjectId ?? null;
    const resolvedProject = projectId
      ? projects.find((p) => p.id === projectId) ?? null
      : null;
    const displayName = resolveDisplayName({
      resolvedProject,
      projectId,
      typedAnswer,
      selectedProjectName,
      suggestedProjects,
    });
    return (
      <AnsweredQuestionsCard
        pairs={[
          { question: title, answer: displayName || t('Project selected') },
        ]}
      />
    );
  }

  const titleNode = (
    <span className="block text-base font-semibold leading-snug text-foreground">
      {title}
    </span>
  );

  const answerRow = (
    <div className="mt-4 border-t border-border/60 pt-3">
      <ChatAnswerInputRow
        fieldId={fieldId}
        value={answer}
        placeholder={t('Type your answer...')}
        onChange={setAnswer}
        onSubmit={handleTyped}
        onSkip={() => onDismiss?.()}
      />
    </div>
  );

  return (
    <ChatCard>
      <ChatCardHeader
        title={titleNode}
        onBack={
          showAll && accessibleSuggested.length > 0
            ? () => setView('list')
            : undefined
        }
        onClose={onDismiss}
      />

      <AnimatePresence mode="wait">
        {showAll ? (
          <motion.div key="all" {...VIEW_TRANSITION}>
            <div className="mt-2.5">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('Search projects...')}
              />
            </div>

            <ProjectGrid
              projects={projects}
              search={search}
              onSelect={handleSelect}
            />

            {answerRow}
          </motion.div>
        ) : (
          <motion.div key="list" {...VIEW_TRANSITION}>
            <div className="mt-2.5 space-y-0.5">
              {collapsedSuggested.map((project) => {
                const name = getProjectName(project);
                return (
                  <ChatOptionRow
                    key={project.id}
                    tabIndex={0}
                    ariaLabel={name}
                    onClick={() => handleSelect(project.id, name)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(project.id, name);
                      }
                    }}
                  >
                    <ApProjectDisplay
                      title={name}
                      icon={project.icon}
                      projectType={project.type}
                      iconClassName="size-7 rounded-md"
                      titleClassName="flex-1 text-sm"
                      framePersonalIcon
                    />
                  </ChatOptionRow>
                );
              })}

              {hasMore && (
                <ChatOptionRow
                  role="button"
                  tabIndex={0}
                  ariaLabel={t('Show all {num} projects', {
                    num: projects.length,
                  })}
                  onClick={() => setView('all')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setView('all');
                    }
                  }}
                >
                  <ChatOptionBadge>
                    <AlignJustify className="size-4" />
                  </ChatOptionBadge>
                  <span className="flex-1 leading-snug">
                    {t('Show all {num} projects', { num: projects.length })}
                  </span>
                </ChatOptionRow>
              )}
            </div>

            {answerRow}
          </motion.div>
        )}
      </AnimatePresence>
    </ChatCard>
  );
}

function ProjectGrid({ projects, search, onSelect }: ProjectGridProps) {
  const named = useMemo(
    () =>
      projects.map((project) => ({ project, name: getProjectName(project) })),
    [projects],
  );
  const query = search.trim().toLowerCase();
  const filtered = query
    ? named.filter(({ name }) => name.toLowerCase().includes(query))
    : named;

  if (filtered.length === 0) {
    return (
      <div className="mt-3 py-8 text-center text-sm text-muted-foreground">
        {t('No project found.')}
      </div>
    );
  }

  return (
    <div className="mt-4 grid max-h-72 grid-cols-1 gap-3 overflow-auto pr-1 sm:grid-cols-2">
      {filtered.map(({ project, name }) => {
        return (
          <button
            key={project.id}
            type="button"
            onClick={() => onSelect(project.id, name)}
            className="group flex items-center justify-between gap-3 rounded-xl border bg-background px-5 py-4 text-left transition-colors hover:border-foreground/30"
          >
            <ApProjectDisplay
              title={name}
              icon={project.icon}
              projectType={project.type}
              iconClassName="size-7 rounded-md"
              titleClassName="text-sm"
              framePersonalIcon
            />
            <span className="inline-flex h-7 min-w-12 shrink-0 items-center justify-center rounded-lg bg-muted px-3 text-sm font-medium text-foreground transition-colors group-hover:bg-muted-foreground/15">
              {t('Use')}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function resolveDisplayName({
  resolvedProject,
  projectId,
  typedAnswer,
  selectedProjectName,
  suggestedProjects,
}: {
  resolvedProject: ProjectItem | null;
  projectId: string | null;
  typedAnswer: string | null;
  selectedProjectName?: string | null;
  suggestedProjects: Array<{ id: string; name: string }>;
}): string {
  if (resolvedProject) return getProjectName(resolvedProject);
  if (typedAnswer) return typedAnswer;
  if (selectedProjectName) return selectedProjectName;
  if (projectId) {
    return suggestedProjects.find((p) => p.id === projectId)?.name ?? '';
  }
  return suggestedProjects[0]?.name ?? '';
}

type ProjectItem = NonNullable<
  ReturnType<typeof projectCollectionUtils.useAll>['data']
>[number];

type ProjectGridProps = {
  projects: ProjectItem[];
  search: string;
  onSelect: (projectId: string, name: string) => void;
};

type ProjectPickerCardProps = {
  picker: ProjectPickerData;
  onResolve: (payload: Record<string, unknown>) => void;
  onDismiss?: () => void;
  isInteractive?: boolean;
  selectedProjectId?: string | null;
  selectedProjectName?: string | null;
};
