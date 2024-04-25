import Quill from 'quill';
import { ApMention, BLOT_NAME } from '@activepieces/ui/common';
import { customCodeMentionDisplayName, fixSelection } from './utils';

export function init() {
  const Embed = Quill.import('blots/embed');

  class MentionBlot extends Embed {
    static blotName: string;
    static tagName: string;
    static className: string;
    hoverHandler: ((e: any) => void) | null;
    clickHandler: ((e: any) => void) | null;
    mounted;
    domNode: HTMLSpanElement;
    constructor(scroll: any, node: any) {
      super(scroll, node);
      this.clickHandler = null;
      this.hoverHandler = null;
      this.mounted = false;
    }

    static create(op: ApMention) {
      const node = super.create();
      if (op.logoUrl) {
        const img: HTMLImageElement = document.createElement('img');
        img.className = 'mention-logo';
        img.src = op.logoUrl;
        node.appendChild(img);
      } else {
        console.warn(`mention ${op.serverValue} doesn't have a logo`);
      }

      node.innerHTML += op.value;
      const cursor =
        op.value === customCodeMentionDisplayName
          ? 'ap-cursor-pointer'
          : 'ap-cursor-auto';
      node.className = `${MentionBlot.className} ${cursor}`;
      return MentionBlot.setDataValues(node, op);
    }

    static setDataValues(element: any, data: any) {
      const domNode = element;
      Object.keys(data).forEach((key) => {
        domNode.dataset[key] = data[key];
      });
      return domNode;
    }

    static value(domNode: any) {
      return domNode.dataset;
    }

    attach() {
      super.attach();

      if (!this.mounted) {
        this.mounted = true;
        this.clickHandler = this.getClickHandler();
        this.hoverHandler = this.getHoverHandler();

        this.domNode.addEventListener('click', this.clickHandler, false);
        this.domNode.addEventListener('mouseenter', this.hoverHandler, false);
      }
    }

    detach() {
      super.detach();
      this.mounted = false;
      if (this.clickHandler) {
        this.domNode.removeEventListener('click', this.clickHandler);
        this.clickHandler = null;
      }
    }

    getClickHandler() {
      return (e: { preventDefault: () => void }) => {
        if (typeof window.getSelection != 'undefined') {
          fixSelection(this.domNode);
        }
        if (
          this.domNode.getAttribute('data-value') ===
          customCodeMentionDisplayName
        ) {
          const textNode = document.createTextNode(
            this.domNode.getAttribute('data-server-value') || ''
          );
          if (this.domNode.parentNode) {
            this.domNode.parentNode.insertBefore(textNode, this.domNode);
            this.domNode.parentNode.removeChild(this.domNode);
          }
        }

        const event = this.buildEvent('mention-clicked', e);
        window.dispatchEvent(event);
        e.preventDefault();
      };
    }

    getHoverHandler() {
      return (e: any) => {
        const event = this.buildEvent('mention-hovered', e);
        window.dispatchEvent(event);
        e.preventDefault();
      };
    }

    buildEvent(name: any, e: any) {
      const event: any = new Event(name, {
        bubbles: true,
        cancelable: true,
      });
      event.value = Object.assign({}, this.domNode.dataset);
      event.event = e;
      return event;
    }
  }

  MentionBlot.blotName = BLOT_NAME;
  MentionBlot.tagName = 'span';
  MentionBlot.className = 'mention-content';

  Quill.register(MentionBlot);
}
