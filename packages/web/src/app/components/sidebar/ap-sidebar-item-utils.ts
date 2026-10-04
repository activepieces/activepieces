function keptSearch({ search, keys }: { search: string; keys: string[] }) {
  const params = new URLSearchParams(search);
  return new URLSearchParams(
    [...params].filter(([key]) => keys.includes(key)),
  ).toString();
}

export const sidebarItemUtils = { keptSearch };
