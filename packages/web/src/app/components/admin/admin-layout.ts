export const adminLayout = {
  contentWidth: 'mx-auto max-w-4xl',
  dialog: {
    sm: 'max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto',
    md: 'max-w-xl max-h-[calc(100dvh-2rem)] overflow-y-auto',
    lg: 'max-w-4xl max-h-[calc(100dvh-2rem)] overflow-y-auto',
  },
  sheet: {
    sm: 'w-full sm:max-w-md',
    md: 'w-full sm:max-w-xl',
    lg: 'w-full sm:max-w-4xl',
  },
} as const;
