const ACQUISITION_PARAM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'ref',
] as const;

function getAcquisitionParams(
  search: string = window.location.search,
): AcquisitionParams {
  const params = new URLSearchParams(search);
  return ACQUISITION_PARAM_KEYS.reduce<AcquisitionParams>((acc, key) => {
    const value = params.get(key);
    if (value) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

export const acquisitionUtils = { getAcquisitionParams };

export type AcquisitionParams = Partial<
  Record<(typeof ACQUISITION_PARAM_KEYS)[number], string>
>;
