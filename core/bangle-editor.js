import { DOMSerializer } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import { BangleEditorState } from './bangle-editor-state';

import { isTestEnv } from './utils/environment';

export class BangleEditor {
  destroyed = false;
  constructor(element, { focusOnInit = true, state, pmViewOpts = {} }) {
    if (!(state instanceof BangleEditorState)) {
      throw new Error(
        'state is required and must be an instance of BangleEditorState',
      );
    }

    this.view = new EditorView(element, {
      state: state.pmState,
      dispatchTransaction(transaction) {
        const newState = this.state.apply(transaction);
        this.updateState(newState);
      },
      attributes: { class: 'bangle-editor' },
      ...pmViewOpts,
    });

    if (focusOnInit) {
      this.focusView();
    }
  }

  focusView() {
    if (isTestEnv() || this.view.focused) {
      return;
    }
    this.view.focus();
  }

  destroy() {
    if (this.destroyed) {
      return;
    }

    // If view was destroyed directly
    if (this.view.docView === null) {
      this.destroyed = true;
      return;
    }

    this.destroyed = true;
    this.view.destroy();
  }

  toHTMLString() {
    const div = document.createElement('div');
    const fragment = DOMSerializer.fromSchema(
      this.view.state.schema,
    ).serializeFragment(this.view.state.doc.content);

    div.appendChild(fragment);
    return div.innerHTML;
  }
}
