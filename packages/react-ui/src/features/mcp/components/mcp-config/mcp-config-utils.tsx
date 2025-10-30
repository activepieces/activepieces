import { t } from 'i18next';

const formatNames = (names: string[]) => {
  if (names.length === 1) {
    return names[0];
  }
  const formattedNames = names.map((name, idx) => {
    if (idx < names.length - 1) {
      return `${name},`;
    }

    return `${t('and')} ${name}`;
  });

  return formattedNames.join(' ');
};

export const mcpConfigUtils = {
  formatNames,
};
