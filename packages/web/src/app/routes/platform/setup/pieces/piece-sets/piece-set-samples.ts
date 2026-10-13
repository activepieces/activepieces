import {
  ColorName,
  PieceSelectionMode,
  PieceSet,
  ProjectType,
  ProjectWithLimits,
  RequiredActionsMode,
} from '@activepieces/shared';
import { t } from 'i18next';

function samplePieceSets({ pieceNames }: { pieceNames: string[] }): PieceSet[] {
  return sampleSpecs().map((sample) =>
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
  const sample = sampleSpecs().find((candidate) => candidate.id === id);
  return (sample?.projects ?? []).map((displayName, index) => ({
    id: `${id}-project-${index}`,
    displayName,
    type: ProjectType.TEAM,
    icon: { color: SAMPLE_COLORS[index % SAMPLE_COLORS.length] },
  }));
}

function sampleProjectCounts(): Map<string, number> {
  return new Map(
    sampleSpecs().map((sample) => [sample.id, sample.projects.length]),
  );
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

function sampleSpecs(): SampleSpec[] {
  return [
    {
      id: 'sample-default',
      name: t('Default'),
      key: null,
      isDefault: true,
      mode: PieceSelectionMode.INCLUDE_ALL,
      share: 0.1,
      fromEnd: false,
      daysAgo: 2,
      projects: [
        t('Marketing'),
        t('Sales ops'),
        t('Engineering'),
        t('People team'),
      ],
    },
    {
      id: 'sample-finance',
      name: t('Finance'),
      key: 'finance',
      isDefault: false,
      mode: PieceSelectionMode.EXCLUDE_ALL,
      share: 0.3,
      fromEnd: false,
      daysAgo: 9,
      projects: [t('Accounts payable'), t('Payroll'), t('Treasury')],
    },
    {
      id: 'sample-support',
      name: t('Customer support'),
      key: 'support',
      isDefault: false,
      mode: PieceSelectionMode.EXCLUDE_ALL,
      share: 0.5,
      fromEnd: true,
      daysAgo: 21,
      projects: [
        t('Help desk'),
        t('Escalations'),
        t('Returns'),
        t('Onboarding'),
      ],
    },
  ];
}

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
