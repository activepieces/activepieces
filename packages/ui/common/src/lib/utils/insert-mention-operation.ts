export interface ApMention {
  value: string;
  serverValue: string;
  data: {
    logoUrl?: string;
  };
}

export interface InsertMentionOperation {
  insert: {
    apMention: ApMention;
  };
}
