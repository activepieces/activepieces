function sectionSearch(search: string): string {
  const params = new URLSearchParams(search);
  return new URLSearchParams(
    [...params].filter(([key]) => SECTION_SEARCH_KEYS.includes(key)),
  ).toString();
}

const SECTION_SEARCH_KEYS = ['month'];

export const sidebarItemUtils = { sectionSearch };
