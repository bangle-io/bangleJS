/**
 * @jest-environment jsdom
 */
/** @jsx psx */
import { toggleMark } from 'tiptap-commands';
import '../../../../test-helpers/jest-helpers';
import { psx } from '../../../../test-helpers/schema-builders';
import { dispatchPasteEvent } from '../../../../test-helpers/dispatch-paste-event';
import { renderTestEditor } from '../../../../test-helpers/render-helper';
import { Link } from '../link';
import {
  BulletList,
  ListItem,
  OrderedList,
} from '../../../../utils/bangle-utils/nodes';

const extensions = [
  new Link(),
  new BulletList(),
  new ListItem(),
  new OrderedList(),
];

const testEditor = renderTestEditor({ extensions });

test('Creates a link correctly', async () => {
  const { editorView } = await testEditor(
    <doc>
      <para>[hello world]</para>
    </doc>,
  );

  toggleMark(editorView.state.schema.marks.link, {
    href: 'https://example.com',
  })(editorView.state, editorView.dispatch);

  expect(editorView.state.doc).toEqualDocument(
    <doc>
      <para>
        <link href="https://example.com">hello world</link>
      </para>
    </doc>,
  );
});

test('Creates a link correctly', async () => {
  const { editorView } = await testEditor(
    <doc>
      <para>hello [world]</para>
    </doc>,
  );

  toggleMark(editorView.state.schema.marks.link, {
    href: 'https://example.com',
  })(editorView.state, editorView.dispatch);

  expect(editorView.state.doc).toEqualDocument(
    <doc>
      <para>
        hello <link href="https://example.com">world</link>
      </para>
    </doc>,
  );
});

test('Pastes a link correctly on an empty selection', async () => {
  const { editorView } = await testEditor(
    <doc>
      <para>hello world[]</para>
    </doc>,
  );

  dispatchPasteEvent(editorView, { plain: 'https://example.com' });

  expect(editorView.state.doc).toEqualDocument(
    <doc>
      <para>
        hello world
        <link href="https://example.com">https://example.com</link>
      </para>
    </doc>,
  );
});

test('Pastes a link correctly', async () => {
  const { editorView } = await testEditor(
    <doc>
      <para>hello [world]</para>
    </doc>,
  );

  dispatchPasteEvent(editorView, { plain: 'https://example.com' });

  expect(editorView.state.doc).toEqualDocument(
    <doc>
      <para>
        hello <link href="https://example.com">world</link>
      </para>
    </doc>,
  );
});

test('Paste a link in a list works', async () => {
  const { editorView } = await testEditor(
    <doc>
      <ul>
        <li>
          <para>first</para>
        </li>
        <li>
          <para>first</para>
          <ul>
            <li>
              <para>nested:1</para>
            </li>
            <li>
              <para>[nested:2]</para>
            </li>
          </ul>
        </li>
      </ul>
    </doc>,
  );

  dispatchPasteEvent(editorView, { plain: 'https://example.com' });

  expect(editorView.state.doc).toEqualDocument(
    <doc>
      <ul>
        <li>
          <para>first</para>
        </li>
        <li>
          <para>first</para>
          <ul>
            <li>
              <para>nested:1</para>
            </li>
            <li>
              <para>
                <link href="https://example.com">[nested:2]</link>
              </para>
            </li>
          </ul>
        </li>
      </ul>
    </doc>,
  );
});
