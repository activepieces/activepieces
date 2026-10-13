function firstAlternative(
  channel: ListenChannel | undefined
): ListenAlternative {
  return channel?.alternatives?.[0] ?? {};
}

function joinChannels({
  channels,
  pick,
}: {
  channels: ListenChannel[];
  pick: (alternative: ListenAlternative) => string | undefined;
}): string | null {
  const parts = channels
    .map((channel) => pick(firstAlternative(channel)))
    .filter(
      (text): text is string => typeof text === 'string' && text.length > 0
    );
  return parts.length > 0 ? parts.join('\n\n') : null;
}

function segmentsOf({
  node,
  key,
}: {
  node: IntelligenceNode | undefined;
  key: 'topics' | 'intents';
}): IntelligenceSegment[] {
  if (!node) {
    return [];
  }
  const nested = node.results?.[key]?.segments;
  return node.segments ?? nested ?? [];
}

function flattenTopics(node: IntelligenceNode | undefined): FlatLabel[] {
  return segmentsOf({ node, key: 'topics' }).flatMap((segment) =>
    (segment.topics ?? []).map((item) => ({
      label: item.topic ?? '',
      confidence: item.confidence_score ?? null,
      text: segment.text ?? '',
    }))
  );
}

function flattenIntents(node: IntelligenceNode | undefined): FlatLabel[] {
  return segmentsOf({ node, key: 'intents' }).flatMap((segment) =>
    (segment.intents ?? []).map((item) => ({
      label: item.intent ?? '',
      confidence: item.confidence_score ?? null,
      text: segment.text ?? '',
    }))
  );
}

function renameLabel({
  items,
  key,
}: {
  items: FlatLabel[];
  key: 'topic' | 'intent';
}): Record<string, string | number | null>[] {
  return items.map((item) => ({
    [key]: item.label,
    confidence: item.confidence,
    text: item.text,
  }));
}

function flattenSentiment(sentiments: SentimentNode | undefined): {
  sentiment: string | null;
  sentiment_score: number | null;
  sentiment_segments: {
    text: string;
    sentiment: string | null;
    sentiment_score: number | null;
  }[];
} {
  return {
    sentiment: sentiments?.average?.sentiment ?? null,
    sentiment_score: sentiments?.average?.sentiment_score ?? null,
    sentiment_segments: (sentiments?.segments ?? []).map((segment) => ({
      text: segment.text ?? '',
      sentiment: segment.sentiment ?? null,
      sentiment_score: segment.sentiment_score ?? null,
    })),
  };
}

function listenSummary(summary: ListenSummary | undefined): {
  summary: string | null;
  warning: string | null;
} {
  if (!summary) {
    return { summary: null, warning: null };
  }
  if (
    summary.result === 'success' &&
    typeof summary.short === 'string' &&
    summary.short.length > 0
  ) {
    return { summary: summary.short, warning: null };
  }
  return {
    summary: null,
    warning: `Summary not available${
      summary.short ? `: ${summary.short}` : '.'
    }`,
  };
}

function speakerTranscript(words: FlatWord[]): string | null {
  if (!words.some((word) => word.speaker !== null)) {
    return null;
  }
  const lines: { speaker: number | null; text: string[] }[] = [];
  for (const word of words) {
    const last = lines[lines.length - 1];
    if (last && last.speaker === word.speaker) {
      last.text.push(word.punctuated_word);
    } else {
      lines.push({ speaker: word.speaker, text: [word.punctuated_word] });
    }
  }
  return lines
    .map((line) => `Speaker ${line.speaker ?? '?'}: ${line.text.join(' ')}`)
    .join('\n');
}

function flattenWords(channels: ListenChannel[]): FlatWord[] {
  return channels.flatMap((channel, index) =>
    (firstAlternative(channel).words ?? []).map((word) => ({
      word: word.word ?? '',
      punctuated_word: word.punctuated_word ?? word.word ?? '',
      start: word.start ?? null,
      end: word.end ?? null,
      confidence: word.confidence ?? null,
      speaker: typeof word.speaker === 'number' ? word.speaker : null,
      channel: index,
    }))
  );
}

function flattenListen({
  body,
  includeWords,
}: {
  body: ListenResponse;
  includeWords: boolean;
}): FlatTranscription {
  const metadata = body.metadata ?? {};
  const results = body.results ?? {};
  const channels = results.channels ?? [];
  const first = firstAlternative(channels[0]);
  const modelId = (metadata.models ?? [])[0];
  const modelInfo = modelId ? metadata.model_info?.[modelId] : undefined;
  const words = flattenWords(channels);
  const speakers = new Set(
    words
      .map((word) => word.speaker)
      .filter((speaker): speaker is number => speaker !== null)
  );
  const summary = listenSummary(results.summary);
  const sentiment = flattenSentiment(results.sentiments);
  const vendorWarnings = (metadata.warnings ?? []).map((warning) =>
    [warning.parameter, warning.message].filter(Boolean).join(': ')
  );
  return {
    request_id: metadata.request_id ?? null,
    transcript: joinChannels({ channels, pick: (alt) => alt.transcript }) ?? '',
    confidence: first.confidence ?? null,
    duration_seconds: metadata.duration ?? null,
    detected_language: channels[0]?.detected_language ?? null,
    language_confidence: channels[0]?.language_confidence ?? null,
    model_name: modelInfo?.name ?? null,
    model_version: modelInfo?.version ?? null,
    channel_count: metadata.channels ?? channels.length,
    paragraphs_text: joinChannels({
      channels,
      pick: (alt) => alt.paragraphs?.transcript?.trim(),
    }),
    speaker_count: speakers.size > 0 ? speakers.size : null,
    speaker_transcript: speakerTranscript(words),
    summary: summary.summary,
    topics: renameLabel({ items: flattenTopics(results.topics), key: 'topic' }),
    intents: renameLabel({
      items: flattenIntents(results.intents),
      key: 'intent',
    }),
    sentiment: sentiment.sentiment,
    sentiment_score: sentiment.sentiment_score,
    utterances: (results.utterances ?? []).map((utterance) => ({
      speaker: typeof utterance.speaker === 'number' ? utterance.speaker : null,
      channel: utterance.channel ?? null,
      start: utterance.start ?? null,
      end: utterance.end ?? null,
      confidence: utterance.confidence ?? null,
      transcript: utterance.transcript ?? '',
    })),
    channels: channels.map((channel, index) => ({
      channel: index,
      transcript: firstAlternative(channel).transcript ?? '',
      confidence: firstAlternative(channel).confidence ?? null,
      detected_language: channel.detected_language ?? null,
    })),
    entities: channels.flatMap((channel, index) =>
      (firstAlternative(channel).entities ?? []).map((entity) => ({
        label: entity.label ?? '',
        value: (entity.value ?? '').trim(),
        confidence: entity.confidence ?? null,
        channel: index,
      }))
    ),
    words: includeWords ? words : [],
    warnings: [
      ...vendorWarnings,
      ...(summary.warning ? [summary.warning] : []),
    ],
  };
}

function readSummary(summary: ReadSummaryNode | undefined): string | null {
  if (!summary) {
    return null;
  }
  const text = summary.text ?? summary.results?.summary?.text;
  return typeof text === 'string' && text.length > 0 ? text : null;
}

function flattenRead(body: ReadResponse): FlatAnalysis {
  const inner = body.metadata?.metadata ?? body.metadata ?? {};
  const results = body.results ?? {};
  const sentiment = flattenSentiment(results.sentiments);
  const infos = [
    inner.summary_info,
    inner.topics_info,
    inner.intents_info,
    inner.sentiment_info,
  ];
  const inputTokens = infos.reduce(
    (max, info) => Math.max(max, info?.input_tokens ?? 0),
    0
  );
  const outputTokens = infos.reduce(
    (sum, info) => sum + (info?.output_tokens ?? 0),
    0
  );
  return {
    request_id: inner.request_id ?? null,
    language: inner.language ?? null,
    summary: readSummary(results.summary),
    topics: renameLabel({ items: flattenTopics(results.topics), key: 'topic' }),
    intents: renameLabel({
      items: flattenIntents(results.intents),
      key: 'intent',
    }),
    sentiment: sentiment.sentiment,
    sentiment_score: sentiment.sentiment_score,
    sentiment_segments: sentiment.sentiment_segments,
    input_tokens: inputTokens > 0 ? inputTokens : null,
    output_tokens: outputTokens > 0 ? outputTokens : null,
  };
}

function summaryOutcome(body: ListenResponse): ListenSummary | undefined {
  return body.results?.summary;
}

function firstTranscript(body: ListenResponse): string | undefined {
  const text = firstAlternative(body.results?.channels?.[0]).transcript;
  return typeof text === 'string' && text.length > 0 ? text : undefined;
}

export const deepgramTranscript = {
  flattenListen,
  flattenRead,
  summaryOutcome,
  firstTranscript,
};

type FlatLabel = {
  label: string;
  confidence: number | null;
  text: string;
};

type FlatWord = {
  word: string;
  punctuated_word: string;
  start: number | null;
  end: number | null;
  confidence: number | null;
  speaker: number | null;
  channel: number;
};

type IntelligenceSegment = {
  text?: string;
  start_word?: number;
  end_word?: number;
  topics?: { topic?: string; confidence_score?: number }[];
  intents?: { intent?: string; confidence_score?: number }[];
};

type IntelligenceNode = {
  segments?: IntelligenceSegment[];
  results?: {
    topics?: { segments?: IntelligenceSegment[] };
    intents?: { segments?: IntelligenceSegment[] };
  };
};

type SentimentNode = {
  segments?: {
    text?: string;
    sentiment?: string;
    sentiment_score?: number;
  }[];
  average?: { sentiment?: string; sentiment_score?: number };
};

type ListenWord = {
  word?: string;
  punctuated_word?: string;
  start?: number;
  end?: number;
  confidence?: number;
  speaker?: number;
};

type ListenAlternative = {
  transcript?: string;
  confidence?: number;
  words?: ListenWord[];
  paragraphs?: { transcript?: string };
  entities?: { label?: string; value?: string; confidence?: number }[];
};

type ListenChannel = {
  alternatives?: ListenAlternative[];
  detected_language?: string;
  language_confidence?: number;
};

type ListenSummary = {
  result?: string;
  short?: string;
};

type ModelInfo = { name?: string; version?: string; arch?: string };

type TokenInfo = { input_tokens?: number; output_tokens?: number };

type ReadSummaryNode = {
  text?: string;
  results?: { summary?: { text?: string } };
};

export type ListenResponse = {
  request_id?: string;
  metadata?: {
    request_id?: string;
    duration?: number;
    channels?: number;
    models?: string[];
    model_info?: Record<string, ModelInfo>;
    warnings?: { parameter?: string; type?: string; message?: string }[];
  };
  results?: {
    channels?: ListenChannel[];
    utterances?: {
      speaker?: number;
      channel?: number;
      start?: number;
      end?: number;
      confidence?: number;
      transcript?: string;
    }[];
    summary?: ListenSummary;
    topics?: IntelligenceNode;
    intents?: IntelligenceNode;
    sentiments?: SentimentNode;
  };
};

export type ReadResponse = {
  metadata?: ReadMetadata & { metadata?: ReadMetadata };
  results?: {
    summary?: ReadSummaryNode;
    topics?: IntelligenceNode;
    intents?: IntelligenceNode;
    sentiments?: SentimentNode;
  };
};

type ReadMetadata = {
  request_id?: string;
  language?: string;
  summary_info?: TokenInfo;
  topics_info?: TokenInfo;
  intents_info?: TokenInfo;
  sentiment_info?: TokenInfo;
};

export type FlatTranscription = {
  request_id: string | null;
  transcript: string;
  confidence: number | null;
  duration_seconds: number | null;
  detected_language: string | null;
  language_confidence: number | null;
  model_name: string | null;
  model_version: string | null;
  channel_count: number;
  paragraphs_text: string | null;
  speaker_count: number | null;
  speaker_transcript: string | null;
  summary: string | null;
  topics: Record<string, string | number | null>[];
  intents: Record<string, string | number | null>[];
  sentiment: string | null;
  sentiment_score: number | null;
  utterances: {
    speaker: number | null;
    channel: number | null;
    start: number | null;
    end: number | null;
    confidence: number | null;
    transcript: string;
  }[];
  channels: {
    channel: number;
    transcript: string;
    confidence: number | null;
    detected_language: string | null;
  }[];
  entities: {
    label: string;
    value: string;
    confidence: number | null;
    channel: number;
  }[];
  words: FlatWord[];
  warnings: string[];
};

export type FlatAnalysis = {
  request_id: string | null;
  language: string | null;
  summary: string | null;
  topics: Record<string, string | number | null>[];
  intents: Record<string, string | number | null>[];
  sentiment: string | null;
  sentiment_score: number | null;
  sentiment_segments: {
    text: string;
    sentiment: string | null;
    sentiment_score: number | null;
  }[];
  input_tokens: number | null;
  output_tokens: number | null;
};
