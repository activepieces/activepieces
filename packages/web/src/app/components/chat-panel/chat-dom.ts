function root(): HTMLDivElement {
  if (!chatNode) {
    chatNode = document.createElement('div');
    chatNode.className = 'flex h-full w-full flex-col';
    chatNode.dataset.chatRoot = '';
  }
  return chatNode;
}

function composer(): HTMLElement | null {
  return root().querySelector<HTMLElement>(
    'textarea, [contenteditable="true"]',
  );
}

function scroller(): HTMLElement | null {
  return root().querySelector<HTMLElement>('[role="log"] > div');
}

let chatNode: HTMLDivElement | null = null;

export const chatDom = { root, composer, scroller };
