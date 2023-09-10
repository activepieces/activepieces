export type DatasourceType = 'from-file';

export const extractConnectionName = (val: string) => {
  const regex = /{{connections\['(.*?)'\]}}/;
  const match = regex.exec(val);
  if (match && match.length > 1) {
    return match[1];
  }
  console.error(`couldn't extract connection name from ${val}`);
  return '';
};
