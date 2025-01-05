import markdownIt from 'markdown-it';
import { listMarkdownPlugin } from './list-markdown';
export const defaultTokenizers = markdownIt('commonmark', {
  html: false,
  breaks: false,
})
  // .enable('table')
  .use(listMarkdownPlugin);
