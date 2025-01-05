

## Banger Editor: Build Powerful Editing Experiences with ProseMirror

Banger Editor is a collection of ProseMirror modules designed to help you build rich text editors quickly and efficiently.

- :battery: **Batteries Included:** Get started quickly with a comprehensive set of Prosemirror packages.
- :spider_web: **Framework Agnostic:** Built with vanilla JS, but plays nicely with React. Vue support is on the roadmap!
- :+1: **Pure ProseMirror:** No abstractions, just pure ProseMirror power. Compatible with other ProseMirror libraries like `tiptap`, `milkdown`, and `novel`.
- :hammer_and_wrench: **Headless and Customizable:** Use our shadcn/ui-like components as a starting point or build your own.


## Getting started


```
npm install banger-editor
```

> [!NOTE]
> Example Repo: https://github.com/kepta/banger-vite-react-starter


**Peer dependencies** As you can see Banger is not traditional Prosemirror wrapper library. It expects you to be familiar with prosemirror and its packages and use them directly. It expects some of the `prosemirror-*` packages to be installed in your project.

If you are starting blank, I recommend installing all the following `prosemirror-*` packages:

```sh
npm install orderedmap prosemirror-commands prosemirror-dropcursor prosemirror-flat-list prosemirror-gapcursor prosemirror-history prosemirror-inputrules prosemirror-keymap prosemirror-model prosemirror-schema-basic prosemirror-state prosemirror-transform prosemirror-view
```

