function element(): HTMLElement | null {
  return document.getElementById(ID);
}

const ID = 'page-column';

export const pageColumnUtils = { element, ID };
