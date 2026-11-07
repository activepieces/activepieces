import { githubDarkInit, githubLight } from '@uiw/codemirror-theme-github';

const githubDark = githubDarkInit({
  settings: { background: 'transparent', gutterBackground: 'transparent' },
});

const codeMirror = (resolvedTheme: string) =>
  resolvedTheme === 'dark' ? githubDark : githubLight;

const jsonView = (resolvedTheme: string) =>
  resolvedTheme === 'dark' ? 'bright' : 'rjv-default';

export const syntaxTheme = {
  codeMirror,
  jsonView,
  shiki: { light: 'github-light', dark: 'github-dark' },
};
