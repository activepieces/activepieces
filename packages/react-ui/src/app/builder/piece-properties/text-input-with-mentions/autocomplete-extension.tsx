import { Node } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import {  StepMetadataWithDisplayName, textMentionUtils } from './text-input-utils';
import { Step } from '../../../../../../shared/src';

function debounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timer: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve, reject) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          const output = callback(...args);
          resolve(output);
        } catch (err) {
          reject(err);
        }
      }, delay);
    });
  };
}
const pluginKey = new PluginKey<DecorationSet>('suggestion');

export const AutocompleteExtension = Node.create<
  {
    applySuggestionKey: string;
    suggestionDebounce: number;
    applySuggestionCallback: (suggestion: string) => void;
    steps: Step[];
    stepsMetadata: (StepMetadataWithDisplayName | undefined)[];
  },
  {
    getSuggestion: ((previousText: string, cb: (suggestion: string | null) => void) => void) | undefined;
    suggestion: string | null;
  }
>({
  name: 'suggestion',

  addOptions() {
    return {
      applySuggestionKey: 'Tab',
      suggestionDebounce: 1500,
      previousTextLength: 4000,
      applySuggestionCallback: () => { },
      steps: [],
      stepsMetadata: [],
    };
  },
  onBlur({event}) {
    const tr = this.editor.state.tr;
    tr.setMeta('addToHistory', false);
    tr.setMeta(pluginKey, { decorations: DecorationSet.empty });

    this.editor.view.dispatch(tr);
  },
  addProseMirrorPlugins() {
    let currentSuggestion: null | string = null;
    const getSuggestion = debounce(async (previousText: string, cb: (suggestion: string | null) => void) => {
      cb(`trigger['body']`);
    }, this.options.suggestionDebounce);
    const options = this.options;
    return [
      new Plugin({
        key: pluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, oldValue) {
            if (tr.getMeta(pluginKey)) {
              // Update the decoration state based on the async data
              const { decorations } = tr.getMeta(pluginKey);
              return decorations;
            }
            return tr.docChanged ? oldValue.map(tr.mapping, tr.doc) : oldValue;
          },
        },
        view() {
          return {
            destroy() {
              currentSuggestion = null;
            },
            update(view, prevState) {

              // This will add the widget decoration at the cursor position
              const selection = view.state.selection;
              const cursorPos = selection.$head.pos;
              const nextNode = view.state.doc.nodeAt(cursorPos);
              // If the cursor is not at the end of the block and we have a suggestion => hide the suggestion
              if (nextNode && !nextNode.isBlock && pluginKey.getState(view.state)?.find().length ) {
                const tr = view.state.tr;
                tr.setMeta('addToHistory', false);
                tr.setMeta(pluginKey, { decorations: DecorationSet.empty });
                view.dispatch(tr);
                return;
              }

              // If the document didn't change, do nothing
              if (prevState && prevState.doc.eq(view.state.doc)) {
                return;
              }

              // reset the suggestion before fetching a new one
              setTimeout(() => {
                const tr = view.state.tr;
                tr.setMeta('addToHistory', false);
                tr.setMeta(pluginKey, { decorations: DecorationSet.empty });
                view.dispatch(tr);
              }, 0);

              // fetch a new suggestion
              const previousText = view.state.doc.textBetween(0, view.state.doc.content.size, ' ').slice(-10000);
              getSuggestion(previousText, (suggestion) => {
                currentSuggestion = suggestion;
                if (!currentSuggestion) return;

                const updatedState = view.state;

                const cursorPos = updatedState.selection.$head.pos;
                const suggestionDecoration = Decoration.widget(
                  cursorPos,
                  () => {
                    const mentionNodeJson = textMentionUtils.createMentionNodeFromText(`{{${currentSuggestion}}}` || '', options.steps, options.stepsMetadata);
                    const mentionNode = textMentionUtils.generateMentionHtmlElement(mentionNodeJson.attrs);
                    mentionNode.classList.add('opacity-65')
                    return mentionNode;
                  },
                  { side: 1 },
                );

                const decorations = DecorationSet.create(updatedState.doc, [suggestionDecoration]);
                const tr = view.state.tr;
                tr.setMeta('addToHistory', false); 
                tr.setMeta(pluginKey, { decorations });
                view.dispatch(tr);
              });
            },
          };
        },
        props: {
          decorations(editorState) {
            return pluginKey.getState(editorState);
          },
          handleKeyDown(view, event) {
            if (event.key === options.applySuggestionKey && currentSuggestion) {
              options.applySuggestionCallback(currentSuggestion);
              return true;
            }
          },
        },
      }),
    ];
  },
});