export interface TimelineEntry {
  step: string;       // es: "routing", "llm_call", "memory_load", "result"
  category: string;   // es: "routing", "llm", "memory", "user", "system"
  timestamp: string;  // ISO string
  details?: any;      // dati extra liberi
}

export function addTimelineEntry(
  list: TimelineEntry[],
  entry: { step: string; category: string; details?: any; timestamp?: string }
): void {
  list.push({
    step: entry.step,
    category: entry.category,
    details: entry.details,
    timestamp: entry.timestamp ?? new Date().toISOString(),
  });
}
