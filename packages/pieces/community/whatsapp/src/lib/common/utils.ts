export const supportedMediaTypes = ['image', 'audio', 'document', 'sticker', 'video'];
export const capitalizeFirstLetter = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
export const mediaTypeSupportsCaption = (type: string) => ['image', 'video', 'document'].includes(type);