import {
  canInsertNode,
  isNodeSelection,
  mergeAttributes,
  Node,
} from '@tiptap/core';
import { NodeSelection, TextSelection } from '@tiptap/pm/state';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: {
      setPageBreak: () => ReturnType;
    };
  }
}

export const PageBreak = Node.create({
  name: 'pageBreak',

  addOptions() {
    return {
      HTMLAttributes: {},
      nextNodeType: 'paragraph',
    };
  },

  group: 'block',

  parseHTML() {
    return [
      { tag: 'div[data-type="pagebreak"]' },
      { tag: 'hr[data-type="pagebreak"]' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        { 'data-type': 'pagebreak', class: 'page-break' },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
    ];
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ chain, state }) => {
          if (!canInsertNode(state, state.schema.nodes[this.name])) {
            return false;
          }

          const { selection } = state;
          const { $to: $originTo } = selection;

          const currentChain = chain();

          if (isNodeSelection(selection)) {
            currentChain.insertContentAt($originTo.pos, { type: this.name });
          } else {
            currentChain.insertContent({ type: this.name });
          }

          return (
            currentChain.command(({ state: chainState, tr, dispatch }) => {
              if (dispatch) {
                const { $to } = tr.selection;
                const posAfter = $to.end();

                if ($to.nodeAfter) {
                  if ($to.nodeAfter.isTextblock) {
                    tr.setSelection(TextSelection.create(tr.doc, $to.pos + 1));
                  } else if ($to.nodeAfter.isBlock) {
                    tr.setSelection(NodeSelection.create(tr.doc, $to.pos));
                  } else {
                    tr.setSelection(TextSelection.create(tr.doc, $to.pos));
                  }
                } else {
                  const nodeType =
                    chainState.schema.nodes[this.options.nextNodeType] ||
                    $to.parent.type.contentMatch.defaultType;
                  const node = nodeType?.create();

                  if (node) {
                    tr.insert(posAfter, node);
                    tr.setSelection(TextSelection.create(tr.doc, posAfter + 1));
                  }
                }

                tr.scrollIntoView();
              }
              return true;
            }).run()
          );
        },
    };
  },
});
