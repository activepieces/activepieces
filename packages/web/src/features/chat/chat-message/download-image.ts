export const downloadImage = (url: string) => {
  if (!url) return;
  const link = document.createElement('a');
  link.href = url;
  link.download = 'image';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
