export const parseFlowIdFromUrl = ({
  url,
  webhookPrefixUrl,
}: ParseFlowIdParams): ParsedDestination => {
  if (!webhookPrefixUrl || webhookPrefixUrl.length === 0) {
    return { kind: 'external' };
  }
  const normalizedPrefix = webhookPrefixUrl.endsWith('/')
    ? webhookPrefixUrl.slice(0, -1)
    : webhookPrefixUrl;
  if (!url.startsWith(`${normalizedPrefix}/`)) {
    return { kind: 'external' };
  }
  const remainder = url.slice(normalizedPrefix.length + 1);
  const flowId = remainder.split('/')[0]?.split('?')[0];
  if (!flowId || flowId.length === 0) {
    return { kind: 'external' };
  }
  return { kind: 'flow', flowId };
};

export type ParsedDestination =
  | { kind: 'flow'; flowId: string }
  | { kind: 'external' };

type ParseFlowIdParams = {
  url: string;
  webhookPrefixUrl: string | null;
};
