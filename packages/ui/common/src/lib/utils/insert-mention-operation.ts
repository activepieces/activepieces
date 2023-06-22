export interface InsertMentionOperation {
  insert: {
    mention: {
      value: string;
      serverValue: string;
      denotationChar: string;
    };
  };
}
