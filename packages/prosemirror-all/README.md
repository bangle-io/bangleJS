![Node.js CI](https://github.com/bangle-io/banger/workflows/Node.js%20CI/badge.svg) [![Netlify Status](https://api.netlify.com/api/v1/badges/6d032d9e-c63a-44e6-ae6d-d36a4905a147/deploy-status)](https://app.netlify.com/sites/bangle/deploys)

## psst we have great documentation at https://banger

## What is Banger Editor ?

Banger Editor is a collection of prosemirror code for building powerful editing experiences.

- :battery: **Batteries included**\
  We expose plenty of components to help you get started with your Editor.

- **Insanely powerful API**\
  Bangle uses [Prosemirror](https://prosemirror.net/) to provide an API which can help you build the next google docs including [collaboration](https://prosemirror.net/examples/collab/#edit-Example).

- **Vanilla JS**\
  Bangle is written in a framework agnostic way, so that you can focus on building the editor and not learning a new framework. That said, we have support for React and I have plans to add Vue support in the coming months.

- **Customize UI with React (more frameworks to come)**\
  Doing UI in vanilla Javascript is not fun. Bangle comes with first party React support and React components (the ones starting with `@bangle.dev/react-`) to add some extra :nail_care: oomph to your Editor.

- **:car: Fast as a racing car**\
  Bangle is as fast as a rich text editor can be; try pasting a really long document in one of its example (:wink: don't forget to compare it with your current favourite editor).

## Getting started

### Installation

**Peer dependencies**
As you can see Banger is not traditional Prosemirror wrapper library. It expects you to be familiar with prosemirror and its packages and use them directly. It expects some of the `prosemirror-*` packages to be installed in your project.

If you are starting blank, I recommend installing all the following `prosemirror-*` packages:

```sh
npm install orderedmap prosemirror-commands prosemirror-dropcursor prosemirror-flat-list prosemirror-gapcursor prosemirror-history prosemirror-inputrules prosemirror-keymap prosemirror-model prosemirror-schema-basic prosemirror-state prosemirror-transform prosemirror-view
```
> Modern bundlers will remove the unused packages from your bundle, so you don't have to worry about bundle size.

> If you know what you are doing or using a Prosemirror wrapper library like `tiptap` you can skip installing the above packages as they might already be installed in your project.

**Installing Banger**

```sh
npm install @bangle.dev/pm @bangle.dev/banger
```

### Prosemirror Imports

You can import the prosemirror packages from `@bangle.dev/pm` (which is a convenience re-export of `prosemirror-*` packages).

```ts
// Option 1: Recommended
import { EditorState, EditorView } from '@bangle.dev/pm';

// Option 2: Importing specific packages
import { EditorState } from '@bangle.dev/pm/state';
import { EditorView } from '@bangle.dev/pm/view';

// Option 3: Use prosemirror-* packages directly
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
```
