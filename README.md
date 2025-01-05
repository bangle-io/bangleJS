

## What is Banger Editor ?

Banger Editor is a collection of ProseMirror code for building powerful editing experiences.

- :battery: **Batteries included**\
We expose plenty of Prosemirror packages to help you get started with your Editor.

- **Vanilla JS**\
Banger is written in a framework agnostic way, so that you can focus on building the editor and not learning a new framework. That said, we have support for React and I have plans to add Vue support in the coming months.

- **No abstraction over Prosemirror**\
Banger is a collection of prosemirror packages, it works alongside prosemirror and not abstracting over it. Because of this, you can use it with any other framework Prosemirror abstraction like `tiptap`, `milkdown`, `novel` etc.

- **Works with React or any other framework**\
Banger is headless and provides you shadcn/ui like components that you can copy paste in your project.


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

