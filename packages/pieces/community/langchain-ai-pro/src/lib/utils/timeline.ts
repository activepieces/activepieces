export function buildTimelineEntry(data: any) {
  return {
    timestamp: Date.now(),
    ...data,
  };
}
