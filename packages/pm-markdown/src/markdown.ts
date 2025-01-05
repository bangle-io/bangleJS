import type { Schema } from 'prosemirror-model';
import { MarkdownParser, MarkdownSerializer } from './pm';
import { defaultTokenizers } from './tokenizer';

type UnnestObjValue<T> = T extends { [k: string]: infer U } ? U : never;

export type MarkdownNodeConfig = {
  toMarkdown: UnnestObjValue<MarkdownSerializer['nodes']>;
  parseMarkdown?: MarkdownParser['tokens'];
};

export type MarkdownMarkConfig = {
  toMarkdown: UnnestObjValue<MarkdownSerializer['marks']>;
  parseMarkdown?: MarkdownParser['tokens'];
};

type MarkdownSpec = {
  id: string;
  markdown?: {
    nodes?: Record<string, MarkdownNodeConfig>;
    marks?: Record<string, MarkdownMarkConfig>;
  };
};

type ParseSpec = ConstructorParameters<typeof MarkdownParser>[2][string];

type TokenCollection =
  | {
      type: 'node';
      parsing: Record<string, ParseSpec>;
      toMarkdown: Record<string, MarkdownNodeConfig['toMarkdown']>;
    }
  | {
      type: 'mark';
      parsing: Record<string, ParseSpec>;
      toMarkdown: Record<string, MarkdownMarkConfig['toMarkdown']>;
    };

function createTokenCollection<T extends 'node' | 'mark'>(
  type: T,
): Extract<TokenCollection, { type: T }> {
  return {
    type,
    parsing: {},
    toMarkdown: {},
  } as any;
}

function processTokens(
  collection: TokenCollection,
  key: string,
  value: MarkdownNodeConfig | MarkdownMarkConfig,
  type: 'node' | 'mark',
) {
  const parse = value.parseMarkdown;
  if (parse) {
    for (const [key, value] of Object.entries(parse)) {
      if (collection.parsing[key]) {
        throw new Error(`Duplicate ${type} parsing token found: ${key}`);
      }
      collection.parsing[key] = value;
    }
  }

  const toMarkdown = value.toMarkdown;
  if (toMarkdown) {
    if (collection.toMarkdown[key]) {
      throw new Error(`Duplicate ${type} toMarkdown token found: ${key}`);
    }
    collection.toMarkdown[key] = toMarkdown;
  }
}

export function markdownLoader(
  items: Array<MarkdownSpec>,
  schema: Schema,
  // TODO
  tokenizers: ConstructorParameters<
    typeof MarkdownParser
  >[1] = defaultTokenizers,
  serializerOptions?: ConstructorParameters<typeof MarkdownSerializer>[2],
) {
  const nodeTokens = createTokenCollection('node');
  const markTokens = createTokenCollection('mark');

  for (const item of items) {
    if (item.markdown?.nodes) {
      for (const [key, value] of Object.entries(item.markdown.nodes)) {
        processTokens(nodeTokens, key, value, 'node');
      }
    }

    if (item.markdown?.marks) {
      for (const [key, value] of Object.entries(item.markdown.marks)) {
        processTokens(markTokens, key, value, 'mark');
      }
    }
  }

  for (const key of Object.keys(nodeTokens.parsing)) {
    if (markTokens.parsing[key]) {
      throw new Error(
        `Token key "${key}" exists in both nodes and marks parsing tokens`,
      );
    }
  }

  return {
    parser: new MarkdownParser(schema, tokenizers, {
      ...nodeTokens.parsing,
      ...markTokens.parsing,
    }),
    serializer: new MarkdownSerializer(
      nodeTokens.toMarkdown,
      markTokens.toMarkdown,
      serializerOptions,
    ),
  };
}
