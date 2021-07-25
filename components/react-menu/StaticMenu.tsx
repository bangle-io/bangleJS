import { BangleEditor } from '@bangle.dev/core';
import { editorStateCounter } from '@bangle.dev/core-components';
import { EditorViewContext, usePluginState } from '@bangle.dev/react';
import PropTypes from 'prop-types';
import React from 'react';

interface StaticMenuProps {
  renderMenu(): JSX.Element;
  editor?: BangleEditor;
}

export function StaticMenu({ editor, renderMenu }: StaticMenuProps) {
  return editor ? (
    <EditorViewContext.Provider value={editor.view}>
      <StaticMenuContainer renderMenu={renderMenu}></StaticMenuContainer>
    </EditorViewContext.Provider>
  ) : null;
}

StaticMenu.propTypes = {
  renderMenu: PropTypes.func.isRequired,
  editor: PropTypes.instanceOf(BangleEditor),
};

function StaticMenuContainer({
  renderMenu,
}: Pick<StaticMenuProps, 'renderMenu'>) {
  usePluginState(editorStateCounter.docChangedKey, true);
  usePluginState(editorStateCounter.selectionChangedKey, true);
  return renderMenu();
}
