import { githubDarkInit, githubLight } from '@uiw/codemirror-theme-github';

const githubDark = githubDarkInit({
  settings: { background: 'transparent', gutterBackground: 'transparent' },
});

const codeMirror = (resolvedTheme: string) =>
  resolvedTheme === 'dark' ? githubDark : githubLight;

const monaco = (resolvedTheme: string) =>
  resolvedTheme === 'dark' ? 'vs-dark' : 'vs';

const jsonView = (resolvedTheme: string) =>
  resolvedTheme === 'dark' ? 'bright' : 'rjv-default';

export const syntaxTheme = {
  codeMirror,
  monaco,
  jsonView,
  shiki: { light: 'github-light', dark: 'github-dark' },
};
