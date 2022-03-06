import type { Node } from '@bangle.dev/pm';

export abstract class Disk {
  abstract load(_key: string): Promise<Node | undefined>;

  abstract update(
    _key: string,
    _getLatestDoc: () => { doc: Node; version: number },
  ): Promise<void>;

  abstract flush(_key: string, _doc: Node, version: number): Promise<void>;
}
