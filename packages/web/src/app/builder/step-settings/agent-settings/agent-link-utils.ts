function externalIdOf(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value
    : undefined;
}

export const agentLinkUtils = { externalIdOf };
