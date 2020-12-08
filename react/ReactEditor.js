import React, { useEffect, useRef, useState } from 'react';
import reactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { objUid } from '@banglejs/core/utils/object-uid';
import { BangleEditorView } from '@banglejs/core/editor';
import { saveRenderHandlers } from '@banglejs/core/node-view';
import { SpecRegistry } from '@banglejs/core/spec-registry';
import { EditorState } from '@banglejs/core/prosemirror/state';
import { NodeViewWrapper } from './NodeViewWrapper';
import {
  nodeViewRenderHandlers,
  nodeViewUpdateStore,
} from './node-view-helpers';

const LOG = true;

let log = LOG ? console.log.bind(console, 'react-editor') : () => {};

export const EditorViewContext = React.createContext();

ReactEditorView.propTypes = {
  id: PropTypes.string,
  renderNodeViews: PropTypes.func,
  onReady: PropTypes.func,
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element),
  ]),
  editorState: PropTypes.exact({
    pmState: PropTypes.instanceOf(EditorState).isRequired,
    specRegistry: PropTypes.instanceOf(SpecRegistry).isRequired,
  }),
  pmViewOpts: PropTypes.object,
};

export function ReactEditorView({
  id,
  renderNodeViews,
  children,
  onReady = () => {},
  editorState: { pmState, specRegistry },
  pmViewOpts,
}) {
  const renderRef = useRef();
  const payloadRef = useRef({ specRegistry, pmState, pmViewOpts });
  const onReadyRef = useRef(onReady);
  const [nodeViews, setNodeViews] = useState([]);
  const [editor, setEditor] = useState();

  useEffect(() => {
    let destroyed = false;
    // save the renderHandlers in the dom to decouple nodeView instantiating code
    // from the editor. Since PM passing view when nodeView is created, the author
    // of the component can get the handler reference from `getRenderHandlers(view)`.
    // Note: this assumes that the pm's dom is the direct child of `editorRenderTarget`.
    saveRenderHandlers(
      renderRef.current,
      nodeViewRenderHandlers((cb) => {
        // use callback for of setState to avoid
        // get fresh nodeViewss
        if (!destroyed) {
          setNodeViews((nodeViews) => cb(nodeViews));
        }
      }),
    );
    const editor = new BangleEditorView(renderRef.current, payloadRef.current);
    editor.view._updatePluginWatcher = updatePluginWatcher(editor);
    onReadyRef.current(editor);
    setEditor(editor);
    return () => {
      destroyed = true;
      editor.destroy();
    };
  }, []);

  return (
    <>
      <div ref={renderRef} id={id} />
      {nodeViews.map((nodeView) => {
        return reactDOM.createPortal(
          <NodeViewWrapper
            debugKey={objUid.get(nodeView)}
            nodeViewUpdateStore={nodeViewUpdateStore}
            nodeView={nodeView}
            renderNodeViews={renderNodeViews}
          />,
          nodeView.mountDOM,
          objUid.get(nodeView),
        );
      })}
      {editor ? (
        <EditorViewContext.Provider value={editor.view}>
          {children}
        </EditorViewContext.Provider>
      ) : null}
    </>
  );
}

const updatePluginWatcher = (editor) => {
  return (watcher, remove = false) => {
    if (editor.destroyed) {
      return;
    }

    let state = editor.view.state;

    const newPlugins = remove
      ? state.plugins.filter((p) => p !== watcher)
      : [...state.plugins, watcher];

    state = state.reconfigure({
      plugins: newPlugins,
    });

    log('Adding watching to existing state', watcher);
    editor.view.updateState(state);
  };
};
