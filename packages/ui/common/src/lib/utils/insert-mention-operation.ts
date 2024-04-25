export const BLOT_NAME = 'apMention';

export interface ApMention {
  value: string;
  serverValue: string;
  logoUrl?: string;
}

export interface InsertMentionOperation {
  insert: {
    [BLOT_NAME]: ApMention;
  };
}
