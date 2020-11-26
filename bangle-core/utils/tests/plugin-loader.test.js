import { SpecSheet } from '../../spec-sheet';
import { corePlugins } from '../../components/index';
import { NodeView } from '../../node-view';
import { pluginLoader } from '../plugin-loader';
import { Plugin, PluginGroup, PluginKey } from '../../plugin';

describe('nodeViews validation', () => {
  test('Throws error if duplicate nodeViews', () => {
    const plugins = [
      ...corePlugins(),
      NodeView.createPlugin({
        name: 'todo_item',
      }),
    ];

    expect(() =>
      pluginLoader(new SpecSheet(), plugins),
    ).toThrowErrorMatchingInlineSnapshot(
      `"NodeView validation failed. Duplicate nodeViews for 'todo_item' found."`,
    );
  });

  test('Does not throw error if no duplicates', () => {
    const plugins = [
      ...corePlugins(),
      NodeView.createPlugin({
        name: 'bullet_list',
      }),
    ];

    expect(() => pluginLoader(new SpecSheet(), plugins)).not.toThrowError();
  });

  test('Throws error if node spec not found', () => {
    const plugins = [
      ...corePlugins(),
      NodeView.createPlugin({
        name: 'random_thing',
      }),
    ];

    expect(() =>
      pluginLoader(new SpecSheet(), plugins),
    ).toThrowErrorMatchingInlineSnapshot(
      `"NodeView validation failed. Spec for 'random_thing' not found."`,
    );
  });
});

describe('Flattens plugins correctly', () => {
  test('Flattens correctly', () => {
    const group1_child = new PluginGroup('grp1_child', [
      [new Plugin({ key: new PluginKey('group1_child.first') })],
    ]);
    const group1 = [
      new Plugin({ key: new PluginKey('group1.first') }),
      new Plugin({ key: new PluginKey('group1.second') }),
      group1_child,
    ];
    const group2 = [new Plugin({ key: new PluginKey('group2.first') })];
    const group3_child = new PluginGroup('grp3child', [
      [new Plugin({ key: new PluginKey('group3_child.first') })],
    ]);
    const group3 = [group3_child];

    const group4 = new Plugin({ key: new PluginKey('group4.first') });
    expect(
      pluginLoader(new SpecSheet(), [group1, group2, group3, group4]).map(
        (r) => r.key,
      ),
    ).toEqual(
      expect.arrayContaining([
        'group1.first$',
        'group1.second$',
        'group1_child.first$',
        'group2.first$',
        'group3_child.first$',
        'group4.first$',
        'history$',
      ]),
    );
  });

  test('Throws error if duplicate groups', () => {
    const group1_child = new PluginGroup('grp1_child', [
      [new Plugin({ key: new PluginKey('group1_child.first') })],
    ]);
    const group1 = [
      new Plugin({ key: new PluginKey('group1.first') }),
      new Plugin({ key: new PluginKey('group1.second') }),
      new PluginGroup('grp1_child', []),
      group1_child,
    ];

    expect(() =>
      pluginLoader(new SpecSheet(), [group1]),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Duplicate names of pluginGroups grp1_child not allowed."`,
    );
  });

  test('Includes history if not provided', () => {
    expect(
      pluginLoader(new SpecSheet(), []).some((r) =>
        r.key.startsWith('history$'),
      ),
    ).toBe(true);
  });

  test('Does not include history if pluginGroup with name history exists', () => {
    expect(
      pluginLoader(new SpecSheet(), [
        new PluginGroup('history', []),
      ]).some((r) => r.key.startsWith('history$')),
    ).toBe(false);
  });
});
