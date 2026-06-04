export type KustomerJsonPrimitive = string | number | boolean | null;

export type KustomerJsonValue =
  | KustomerJsonPrimitive
  | KustomerJsonObject
  | KustomerJsonValue[];

export type KustomerJsonObject = {
  [key: string]: KustomerJsonValue;
};

export type KustomerQueryParams = Record<string, string>;
