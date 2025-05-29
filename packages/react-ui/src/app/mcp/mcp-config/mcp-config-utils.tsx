import { t } from 'i18next';

const formatNames = (names: string[]) => {
  const slicedNames = names.slice(0, 3);
  const formattedNames = slicedNames.map((name, idx) => {
    if (idx < Math.min(2, slicedNames.length - 1)) {
      return `${name}, `;
    }
    return name;
  });
  if (names.length > 3) {
    return `${formattedNames.join('')} ${t('and')} ${names.length - 3} ${t(
      'more',
    )}`;
  }
  return formattedNames.join('');
};

export const mcpConfigUtils = {
  formatNames,
};
