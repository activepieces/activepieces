export const concatLink = (host: string, path: string): string => {
  const trimmedHost = host.endsWith("/") ? host.slice(0, -1) : host // eslint-disable-line no-magic-numbers
  const trimmedPath = path.startsWith("/") ? path : `/${path}`
  return `${trimmedHost}${trimmedPath}`
}
