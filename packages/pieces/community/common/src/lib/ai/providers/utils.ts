export function authHeader(options: AuthHeaderOptions): AuthHeader {
  return {
    name: options.bearer ? 'Authorization' as const : options.name,
    mapper: options.bearer ? headerValueMappers.bearer : options.mapper ?? headerValueMappers.default,
  };
}

export type HeaderValueMapper = (value: string) => string;

export type AuthHeader = {
  name: string
  mapper: HeaderValueMapper
}

type AuthHeaderOptions =
  | { bearer: true; }
  | { bearer: false; name: string; mapper?: HeaderValueMapper; };

const headerValueMappers = {
  bearer: (value: string) => `Bearer ${value}`,
  default: (value: string) => value
};