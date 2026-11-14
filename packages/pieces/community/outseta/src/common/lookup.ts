import { isNil } from '@activepieces/pieces-framework';

function single(candidates: LookupCandidate[]): ResolvedLookup {
  const filled = candidates.filter(
    (candidate): candidate is ResolvedLookup =>
      !isNil(candidate.value) && candidate.value !== ''
  );

  if (filled.length === 0) {
    throw new Error(
      `Nothing to look up. Fill one of: ${candidates
        .map((candidate) => candidate.label)
        .join(', ')}.`
    );
  }

  if (filled.length > 1) {
    throw new Error(
      `Two lookup values are filled (${filled
        .map((candidate) => candidate.label)
        .join(', ')}). Clear the one you are not using — switch tabs to find it.`
    );
  }

  return filled[0];
}

export const outsetaLookup = { single };

export type LookupCandidate = {
  key: string;
  label: string;
  value: string | undefined | null;
};

type ResolvedLookup = LookupCandidate & { value: string };
