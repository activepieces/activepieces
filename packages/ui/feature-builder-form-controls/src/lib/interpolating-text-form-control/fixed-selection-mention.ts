import Quill from 'quill';
import { fixSelection } from './utils';

const Embed = Quill.import('blots/embed');

class MentionBlot extends Embed {
  static blotName: string;
  static tagName: string;
  static className: string;
  hoverHandler: ((e: any) => void) | null;
  clickHandler: ((e: any) => void) | null;
  mounted;
  domNode: any;
  constructor(scroll: any, node: any) {
    super(scroll, node);
    this.clickHandler = null;
    this.hoverHandler = null;
    this.mounted = false;
  }

  static create(data: { denotationChar: string; value: any }) {
    const node = super.create();
    const denotationChar = document.createElement('span');
    denotationChar.className = 'ql-mention-denotation-char';
    denotationChar.innerHTML = data.denotationChar;
    node.appendChild(denotationChar);
    node.innerHTML += data.value;
    return MentionBlot.setDataValues(node, data);
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

MentionBlot.blotName = 'mention';
MentionBlot.tagName = 'span';
MentionBlot.className = 'mention';

Quill.register(MentionBlot);
