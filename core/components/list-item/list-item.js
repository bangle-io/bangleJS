import { chainCommands } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';
import { NodeView } from '../../node-view';
import {
  indentList,
  backspaceKeyCommand,
  enterKeyCommand,
  outdentList,
  moveEdgeListItem,
} from './commands';
import {
  cutEmptyCommand,
  copyEmptyCommand,
  parentHasDirectParentOfType,
  moveNode,
} from '../../core-commands';
import { filter, insertEmpty } from '../../utils/pm-utils';
import { createElement, domSerializationHelpers } from '../../utils/index';

const LOG = true;

let log = LOG ? console.log.bind(console, 'list-item') : () => {};

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  indentListItem,
  outdentListItem,
};
export const defaultKeys = {
  indent: 'Tab',
  outdent: 'Shift-Tab',
  moveDown: 'Alt-ArrowDown',
  moveUp: 'Alt-ArrowUp',
  emptyCopy: 'Mod-c',
  emptyCut: 'Mod-x',
  insertEmptyListAbove: 'Mod-Shift-Enter',
  insertEmptyListBelow: 'Mod-Enter',
};

const name = 'listItem';
const getTypeFromSchema = (schema) => schema.nodes[name];

function specFactory(opts = {}) {
  const { toDOM, parseDOM } = domSerializationHelpers(name, {
    tag: 'li',
    content: 0,
  });

  return {
    type: 'node',
    name,
    schema: {
      content: '(paragraph) (paragraph | bulletList | orderedList)*',
      defining: true,
      draggable: true,
      parseDOM,
      attrs: {
        todoChecked: {
          default: null,
        },
      },
      toDOM,
    },
    markdown: {
      toMarkdown(state, node) {
        if (node.attrs.todoChecked != null) {
          state.write(node.attrs.todoChecked ? '[x] ' : '[ ] ');
        }
        state.renderContent(node);
      },
      parseMarkdown: {
        list_item: {
          block: name,
          getAttrs: (tok) => {
            return {
              todoChecked: tok.attrGet('isDone'),
            };
          },
        },
      },
    },
  };
}

function pluginsFactory({ keybindings = defaultKeys, nodeView = true } = {}) {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);
    const parentCheck = parentHasDirectParentOfType(type, [
      schema.nodes['bulletList'],
      schema.nodes['orderedList'],
    ]);

    const move = (dir) =>
      chainCommands(moveNode(type, dir), moveEdgeListItem(type, dir));

    return [
      keybindings &&
        keymap({
          Backspace: backspaceKeyCommand(type),
          Enter: enterKeyCommand(type),
          [keybindings.indent]: indentListItem(),
          [keybindings.outdent]: outdentListItem(),
          [keybindings.moveUp]: filter(parentCheck, move('UP')),
          [keybindings.moveDown]: filter(parentCheck, move('DOWN')),
          [keybindings.emptyCut]: filter(parentCheck, cutEmptyCommand(type)),
          [keybindings.emptyCopy]: filter(parentCheck, copyEmptyCommand(type)),
          [keybindings.insertEmptyListAbove]: filter(
            parentCheck,
            insertEmpty(type, 'above', true),
          ),
          [keybindings.insertEmptyListBelow]: filter(
            parentCheck,
            insertEmpty(type, 'below', true),
          ),
        }),

      nodeView && listItemNodePlugin(),
    ];
  };
}

function listItemNodePlugin() {
  const checkParentBulletList = (state, pos) => {
    return state.doc.resolve(pos).parent.type.name === 'bulletList';
  };

  const removeCheckbox = (instance) => {
    // already removed
    if (!instance.containerDOM.hasAttribute('data-bangle-is-todo')) {
      return;
    }
    instance.containerDOM.removeAttribute('data-bangle-is-todo');
    instance.containerDOM.removeChild(instance.containerDOM.firstChild);
  };

  const setupCheckbox = (attrs, updateAttrs, instance) => {
    // no need to create as it is already created
    if (instance.containerDOM.hasAttribute('data-bangle-is-todo')) {
      return;
    }

    const checkbox = createCheckbox(attrs.todoChecked, (newValue) => {
      updateAttrs({
        // Fetch latest attrs as the one in outer
        // closure can be stale.
        todoChecked: newValue,
      });
    });

    instance.containerDOM.setAttribute('data-bangle-is-todo', '');
    instance.containerDOM.prepend(checkbox);
  };

  const createCheckbox = (todoChecked, onUpdate) => {
    const checkBox = createElement([
      'span',
      { contentEditable: false },
      [
        'input',
        {
          type: 'checkbox',
        },
      ],
    ]);
    const inputElement = checkBox.querySelector('input');

    if (todoChecked) {
      inputElement.setAttribute('checked', '');
    }

    inputElement.addEventListener('input', (e) => {
      log('change event', inputElement.checked);
      onUpdate(
        // note:  inputElement.checked is a bool
        inputElement.checked,
      );
    });

    return checkBox;
  };

  return NodeView.createPlugin({
    name,
    containerDOM: [
      'li',
      {
        // To style our todo friend different than a regular li
        'data-bangle-name': name,
      },
    ],
    contentDOM: ['span', {}],
    renderHandlers: {
      create: (instance, { attrs, updateAttrs, getPos, view }) => {
        const todoChecked = attrs['todoChecked'];

        // branch if todo needs to be created
        if (todoChecked != null) {
          // todo only makes sense if parent is bullet list
          if (checkParentBulletList(view.state, getPos())) {
            setupCheckbox(attrs, updateAttrs, instance);
          } else {
            // if parent is not bulletList i.e. it is orderedList
            // unset the todoChecked attribute as it has no meaning for ol's
            setTimeout(() => {
              updateAttrs({
                todoChecked: null,
              });
            }, 0);
          }
        }

        // Connect the two contentDOM and containerDOM for pm to write to
        instance.containerDOM.appendChild(instance.contentDOM);
      },

      // We need to achieve a two way binding of the todoChecked state.
      // First binding: dom -> editor : done by  inputElement's `input` event listener
      // Second binding: editor -> dom: Done by the `update` handler below
      update: (instance, { attrs, view, getPos, updateAttrs }) => {
        const { todoChecked } = attrs;

        if (todoChecked == null) {
          removeCheckbox(instance);
          return;
        }

        // if parent is not bulletList i.e. it is orderedList
        // unset the todoChecked attribute as it has no meaning for ol's
        if (!checkParentBulletList(view.state, getPos())) {
          log('clearing shit', getPos());
          setTimeout(() => {
            updateAttrs({
              todoChecked: null,
            });
          }, 0);
          return;
        }

        // assume nothing about the dom elements state.
        // for example it is possible that the checkbox is not created
        // when a regular list is converted to todo list only update handler
        // will be called. The create handler was called in the past
        // but without the checkbox element, hence the checkbox wont be there
        setupCheckbox(attrs, updateAttrs, instance);

        const checkbox = instance.containerDOM.firstChild.firstChild;

        const hasAttribute = checkbox.hasAttribute('checked');
        if (todoChecked === hasAttribute) {
          log('skipping update', todoChecked, hasAttribute);
          return;
        }
        log('updating inputElement');
        if (todoChecked) {
          checkbox.setAttribute('checked', 'true');
        } else {
          checkbox.removeAttribute('checked');
        }
      },

      destroy: () => {},
    },
  });
}

export function indentListItem() {
  return (state, dispatch, view) => {
    const type = getTypeFromSchema(state.schema);
    return indentList(type)(state, dispatch, view);
  };
}

export function outdentListItem() {
  return (state, dispatch, view) => {
    const type = getTypeFromSchema(state.schema);
    return outdentList(type)(state, dispatch, view);
  };
}
