import type { PluginWithOptions } from 'markdown-it';
import type Token from 'markdown-it/lib/token.mjs';

/**
 * This plugin is responsible for customizing how bullet, ordered,
 * and task lists are parsed and rendered in Markdown. Since
 * markdown-it does NOT set task attributes by default,
 * we detect tasks ourselves by checking for "[ ] ", "[x] ", or "[X] "
 * at the beginning of a list item after inline processing. We then
 * mark those list items with data-bangle-list-kind="task"
 * and set data-bangle-task-checked="true"/"false".
 *
 * We ignore label logic or other UI aspects, leaving that to ProseMirror.
 */

export type ListMarkdownPluginOptions = Record<string, never>;

export const listMarkdownPlugin: PluginWithOptions<
  ListMarkdownPluginOptions
> = (md, _options) => {
  // 1) After the "inline" rule, mark bullet vs. ordered lists
  //    so our consumers can identify data-bangle-list-kind="bullet"/"ordered".
  md.core.ruler.after('inline', 'bangle-list-kind-attrs', (state) => {
    const tokens = state.tokens;
    let currentListKind: string | null = null;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (isBulletListOpen(token)) {
        currentListKind = 'bullet';
        token?.attrSet('data-bangle-list-kind', 'bullet');
      } else if (isOrderedListOpen(token)) {
        currentListKind = 'ordered';
        token?.attrSet('data-bangle-list-kind', 'ordered');
      } else if (
        token?.type === 'bullet_list_close' ||
        token?.type === 'ordered_list_close'
      ) {
        currentListKind = null;
      } else if (token?.type === 'list_item_open' && currentListKind) {
        // Only set the list kind if it's not already set (to preserve task items)
        if (!token.attrGet('data-bangle-list-kind')) {
          token.attrSet('data-bangle-list-kind', currentListKind);
        }
      }
    }
    return false;
  });

  // 2) After the "inline" rule, detect if the list item is a todo/task
  //    by checking the inline content for "[ ] " or "[x] ".
  md.core.ruler.after('inline', 'bangle-task-lists', (state) => {
    const tokens = state.tokens;
    // Start from i=2 to safely reference (i-1) and (i-2)
    for (let i = 2; i < tokens.length; i++) {
      if (isTodoItem(tokens, i)) {
        convertToTaskItem(tokens, i);
      }
    }
    return false;
  });

  // 3) Renderers to embed specific data- attributes in output HTML
  //    so we can re-parse them if needed. This part also ensures
  //    that any tasks are output with the correct data-bangle attributes.
  const originalRenderToken = md.renderer.renderToken.bind(md.renderer);
  md.renderer.renderToken = (tokens, idx, options) => {
    const token = tokens[idx];
    // For bullet/ordered list tokens, we just keep data-bangle-list-kind
    // as assigned above.
    // For list items that are tasks, set the data-bangle-list-kind="task" and
    // data-bangle-task-checked accordingly.
    if (token?.type === 'list_item_open') {
      // If the item is a task, the "convertToTaskItem" step set these attributes
      const kindAttr = token?.attrGet('data-bangle-list-kind');
      if (kindAttr === 'task') {
        // It's a task
        const checkedAttr =
          token.attrGet('data-bangle-task-checked') || 'false';
        token.attrSet('data-bangle-task-checked', checkedAttr);
      }
    }
    return originalRenderToken(tokens, idx, options);
  };
};

function isOrderedListOpen(token?: Token): boolean {
  return token?.type === 'ordered_list_open';
}

function isBulletListOpen(token?: Token): boolean {
  return token?.type === 'bullet_list_open';
}

function isTodoItem(tokens: Token[], index: number): boolean {
  return (
    isInline(tokens[index]) &&
    isParagraphOpen(tokens[index - 1]) &&
    isListItemOpen(tokens[index - 2]) &&
    startsWithTodoMarkdown(tokens[index]?.content)
  );
}

function startsWithTodoMarkdown(content?: string): boolean {
  if (!content) return false;
  const prefix = content.slice(0, 4).toLowerCase();
  return prefix === '[ ] ' || prefix === '[x] ';
}

function convertToTaskItem(tokens: Token[], index: number) {
  const listItemOpen = tokens[index - 2];
  const inlineToken = tokens[index];

  if (!listItemOpen || !inlineToken || !inlineToken.children) return;

  listItemOpen.attrSet('data-bangle-list-kind', 'task');

  // Determine if it's checked or not
  const firstChild = inlineToken.children[0];
  if (firstChild?.type === 'text') {
    const text = firstChild.content;
    const isChecked = text[1]?.toLowerCase() === 'x';
    listItemOpen.attrSet(
      'data-bangle-task-checked',
      isChecked ? 'true' : 'false',
    );

    // Remove the leading "[ ] " or "[x] " from the first text token
    if (
      text.startsWith('[ ] ') ||
      text.startsWith('[x] ') ||
      text.startsWith('[X] ')
    ) {
      firstChild.content = text.slice(4);
    }
  }
}

// ------------------------------------------------------
function isInline(token?: Token) {
  return token?.type === 'inline';
}
function isParagraphOpen(token?: Token) {
  return token?.type === 'paragraph_open';
}
function isListItemOpen(token?: Token) {
  return token?.type === 'list_item_open';
}
