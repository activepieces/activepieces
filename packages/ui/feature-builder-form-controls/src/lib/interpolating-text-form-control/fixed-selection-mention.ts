import Quill from 'quill';
import { customCodeMentionDisplayName, fixSelection } from './utils';
import { ApMention } from '@activepieces/ui/common';

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
      console.log('constructor');
      super(scroll, node);
      this.clickHandler = null;
      this.hoverHandler = null;
      this.mounted = false;
    }

    static create(op: ApMention) {
      const node = super.create();
      if (op.data.logoUrl) {
        const img: HTMLImageElement = document.createElement('img');
        img.className = 'mention-logo';
        img.src = op.data.logoUrl;
        node.appendChild(img);
      } else {
        console.warn(`mention ${op.serverValue} doesn't have a logo`);
      }

      node.innerHTML += op.value;
      const cursor =
        op.value === customCodeMentionDisplayName
          ? 'ap-cursor-pointer'
          : 'ap-cursor-auto';
      node.className = `mention-content ${cursor}`;
      return MentionBlot.setDataValues(node, op);
    }

    static setDataValues(element: any, data: { [x: string]: any }) {
      const domNode = element;
      Object.keys(data).forEach((key) => {
        domNode.dataset[key] = data[key];
      });
      return domNode;
    }

    static value(domNode: { dataset: any }) {
      return domNode.dataset;
    }

    attach() {
      super.attach();

      if (!this.mounted) {
        this.mounted = true;
        this.clickHandler = this.getClickHandler();
        this.hoverHandler = this.getHoverHandler();
        this.domNode.addEventListener(
          'focus',
          () => {
            console.log('mention focus');
          },
          false
        );
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
      return (e: { preventDefault: () => void }) => {
        const event = this.buildEvent('mention-hovered', e);
        window.dispatchEvent(event);
        e.preventDefault();
      };
    }

    buildEvent(name: string, e: any) {
      const event = new Event(name, {
        bubbles: true,
        cancelable: true,
      });
      (event as any).value = Object.assign({}, this.domNode.dataset);
      (event as any).event = e;
      return event;
    }
  }

  MentionBlot.blotName = 'apMention';
  MentionBlot.tagName = 'span';
  MentionBlot.className = 'mention';

  Quill.register(MentionBlot);
}
