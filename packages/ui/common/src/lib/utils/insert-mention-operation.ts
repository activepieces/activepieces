export interface ApMention {
  value: string;
  serverValue: string;
  logoUrl?: string;
}

export interface InsertMentionOperation {
  insert: {
    apMention: ApMention;
  };
}
