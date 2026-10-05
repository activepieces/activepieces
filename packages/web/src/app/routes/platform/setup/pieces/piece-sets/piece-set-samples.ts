import {
  PieceSelectionMode,
  PieceSet,
  RequiredActionsMode,
} from '@activepieces/shared';

function samplePieceSets({ pieceNames }: { pieceNames: string[] }): PieceSet[] {
  return SAMPLES.map((sample) =>
    toPieceSet({
      ...sample,
      exceptions: pieceNames.slice(0, sample.exceptions),
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

function toPieceSet({
  id,
  name,
  key,
  isDefault,
  mode,
  exceptions,
  daysAgo,
}: Omit<SampleSpec, 'exceptions'> & { exceptions: string[] }): PieceSet {
  const updated = new Date(SAMPLE_EPOCH - daysAgo * DAY_MS).toISOString();
  return {
    id,
    created: updated,
    updated,
    platformId: 'sample',
    name,
    key,
    isDefault,
    generatedForProjectId: null,
    config: {
      pieces: { mode, exceptions },
      selectedActions: {},
      selectedTriggers: {},
      requiredActions: [],
      requiredActionsMode: RequiredActionsMode.ANY,
    },
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

const SAMPLE_EPOCH = Date.now();

const SAMPLES: SampleSpec[] = [
  {
    id: 'sample-default',
    name: 'Everyone',
    key: null,
    isDefault: true,
    mode: PieceSelectionMode.INCLUDE_ALL,
    exceptions: 3,
    daysAgo: 2,
  },
  {
    id: 'sample-finance',
    name: 'Finance',
    key: 'finance',
    isDefault: false,
    mode: PieceSelectionMode.EXCLUDE_ALL,
    exceptions: 12,
    daysAgo: 9,
  },
  {
    id: 'sample-support',
    name: 'Customer support',
    key: 'support',
    isDefault: false,
    mode: PieceSelectionMode.EXCLUDE_ALL,
    exceptions: 24,
    daysAgo: 21,
  },
];

export const SAMPLE_PROJECT_COUNTS = new Map<string, number>([
  ['sample-default', 9],
  ['sample-finance', 3],
  ['sample-support', 4],
]);

export const pieceSetSamples = { samplePieceSets, samplePieceSet };

type SampleSpec = {
  id: string;
  name: string;
  key: string | null;
  isDefault: boolean;
  mode: PieceSelectionMode;
  exceptions: number;
  daysAgo: number;
};
