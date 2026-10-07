import {
  ColorName,
  PieceSelectionMode,
  PieceSet,
  ProjectType,
  ProjectWithLimits,
  RequiredActionsMode,
} from '@activepieces/shared';

function samplePieceSets({ pieceNames }: { pieceNames: string[] }): PieceSet[] {
  return SAMPLES.map((sample) =>
    toPieceSet({
      sample,
      exceptions: sampleExceptions({ sample, pieceNames }),
    }),
  );
}

function samplePieceSet({
  id,
  pieceNames,
}: {
  id: string;
  pieceNames: string[];
}): PieceSet | undefined {
  return samplePieceSets({ pieceNames }).find((set) => set.id === id);
}

function sampleProjects(id: string): SampleProject[] {
  const sample = SAMPLES.find((candidate) => candidate.id === id);
  return (sample?.projects ?? []).map((displayName, index) => ({
    id: `${id}-project-${index}`,
    displayName,
    type: ProjectType.TEAM,
    icon: { color: SAMPLE_COLORS[index % SAMPLE_COLORS.length] },
  }));
}

function sampleProjectCounts(): Map<string, number> {
  return new Map(SAMPLES.map((sample) => [sample.id, sample.projects.length]));
}

function sampleExceptions({
  sample,
  pieceNames,
}: {
  sample: SampleSpec;
  pieceNames: string[];
}): string[] {
  const count =
    sample.mode === PieceSelectionMode.INCLUDE_ALL
      ? Math.floor(pieceNames.length * sample.share)
      : Math.max(1, Math.ceil(pieceNames.length * sample.share));
  const ordered = sample.fromEnd ? [...pieceNames].reverse() : pieceNames;
  return ordered.slice(0, Math.min(count, pieceNames.length));
}

function toPieceSet({
  sample,
  exceptions,
}: {
  sample: SampleSpec;
  exceptions: string[];
}): PieceSet {
  const updated = new Date(Date.now() - sample.daysAgo * DAY_MS).toISOString();
  return {
    id: sample.id,
    created: updated,
    updated,
    platformId: 'sample',
    name: sample.name,
    key: sample.key,
    isDefault: sample.isDefault,
    generatedForProjectId: null,
    config: {
      pieces: { mode: sample.mode, exceptions },
      selectedActions: {},
      selectedTriggers: {},
      requiredActions: { mode: RequiredActionsMode.ANY, actions: {} },
    },
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

const SAMPLE_COLORS = [
  ColorName.BLUE,
  ColorName.GREEN,
  ColorName.ORANGE,
  ColorName.PURPLE,
  ColorName.PINK,
];

const SAMPLES: SampleSpec[] = [
  {
    id: 'sample-default',
    name: 'Default',
    key: null,
    isDefault: true,
    mode: PieceSelectionMode.INCLUDE_ALL,
    share: 0.1,
    fromEnd: false,
    daysAgo: 2,
    projects: ['Marketing', 'Sales ops', 'Engineering', 'People team'],
  },
  {
    id: 'sample-finance',
    name: 'Finance',
    key: 'finance',
    isDefault: false,
    mode: PieceSelectionMode.EXCLUDE_ALL,
    share: 0.3,
    fromEnd: false,
    daysAgo: 9,
    projects: ['Accounts payable', 'Payroll', 'Treasury'],
  },
  {
    id: 'sample-support',
    name: 'Customer support',
    key: 'support',
    isDefault: false,
    mode: PieceSelectionMode.EXCLUDE_ALL,
    share: 0.5,
    fromEnd: true,
    daysAgo: 21,
    projects: ['Help desk', 'Escalations', 'Returns', 'Onboarding'],
  },
];

export const pieceSetSamples = {
  samplePieceSets,
  samplePieceSet,
  sampleProjects,
  sampleProjectCounts,
};

type SampleSpec = {
  id: string;
  name: string;
  key: string | null;
  isDefault: boolean;
  mode: PieceSelectionMode;
  share: number;
  fromEnd: boolean;
  daysAgo: number;
  projects: string[];
};

export type SampleProject = Pick<
  ProjectWithLimits,
  'id' | 'displayName' | 'type' | 'icon'
>;
