(window.webpackJsonp=window.webpackJsonp||[]).push([[50],{114:function(e,t,n){"use strict";n.r(t),n.d(t,"frontMatter",(function(){return o})),n.d(t,"metadata",(function(){return c})),n.d(t,"rightToc",(function(){return l})),n.d(t,"default",(function(){return s}));var r=n(3),a=n(7),i=(n(0),n(156)),o={title:"Getting started",sidebar_label:"Getting Started"},c={unversionedId:"getting-started",id:"getting-started",isDocsHomePage:!1,title:"Getting started",description:"To get started with bangle.dev you need to install the core module:",source:"@site/docs/getting-started.md",slug:"/getting-started",permalink:"/docs/getting-started",editUrl:"https://github.com/bangle-io/bangle.dev/edit/master/_bangle-website/docs/getting-started.md",version:"current",sidebar_label:"Getting Started",sidebar:"docs",previous:{title:"Hello",permalink:"/docs/"},next:{title:"Markdown",permalink:"/docs/examples/markdown-editor"}},l=[{value:"With React",id:"with-react",children:[]},{value:"Stability",id:"stability",children:[]},{value:"The Bangle eco-system",id:"the-bangle-eco-system",children:[]}],p={rightToc:l};function s(e){var t=e.components,n=Object(a.a)(e,["components"]);return Object(i.b)("wrapper",Object(r.a)({},p,n,{components:t,mdxType:"MDXLayout"}),Object(i.b)("p",null,"To get started with bangle.dev you need to install the core module:"),Object(i.b)("pre",null,Object(i.b)("code",Object(r.a)({parentName:"pre"},{}),"npm install @bangle.dev/core\n")),Object(i.b)("h2",{id:"with-react"},"With React"),Object(i.b)("p",null,"Bangle at its heart is framework agnostic, but it comes with first party support for React. To get started, run the follow command:"),Object(i.b)("pre",null,Object(i.b)("code",Object(r.a)({parentName:"pre"},{}),"npm install @bangle.dev/react\n")),Object(i.b)("p",null,"\u2764\ufe0f Support for ",Object(i.b)("strong",{parentName:"p"},"Vue")," is coming soon. Meanwhile you can either use vanilla Bangle Components ",Object(i.b)("em",{parentName:"p"},"or")," consider ",Object(i.b)("a",Object(r.a)({parentName:"p"},{href:"https://github.com/ueberdosis/tiptap"}),"tiptap")," an awesome library which runs the same ",Object(i.b)("a",Object(r.a)({parentName:"p"},{href:"https://prosemirror.net"}),"Prosemirror")," blood in its veins!"),Object(i.b)("h2",{id:"stability"},"Stability"),Object(i.b)("p",null,Object(i.b)("strong",{parentName:"p"},"Current"),":"),Object(i.b)("ul",null,Object(i.b)("li",{parentName:"ul"},"Bangle is currently in ",Object(i.b)("inlineCode",{parentName:"li"},"alpha")," phase and we plan to iterate fast, bug fixes and many breaking changes. I would request you to try it out and use it in your side projects but avoid using it in ",Object(i.b)("strong",{parentName:"li"},"production"),".")),Object(i.b)("p",null,Object(i.b)("strong",{parentName:"p"},"Short term"),":"),Object(i.b)("ul",null,Object(i.b)("li",{parentName:"ul"},"Once we achieve a good stable month with ",Object(i.b)("inlineCode",{parentName:"li"},"beta")," with some community adoption, we can move to general release. I expect this to come around March or April.")),Object(i.b)("h2",{id:"the-bangle-eco-system"},"The Bangle eco-system"),Object(i.b)("p",null,"The Bangle project is made up of smaller individual packages to fit a particular scoped need. You can find their documentation under the API section of the sidebar. Please keep the following things in mind when consuming any of the Bangle packages:"),Object(i.b)("ul",null,Object(i.b)("li",{parentName:"ul"},Object(i.b)("p",{parentName:"li"},"Only the packages with names starting ",Object(i.b)("inlineCode",{parentName:"p"},"@bangle.dev/react-")," require a React dependency.")),Object(i.b)("li",{parentName:"ul"},Object(i.b)("p",{parentName:"li"},"Certain packages have a peer dependency on other Bangle packages, your package manager should help you install them.")),Object(i.b)("li",{parentName:"ul"},Object(i.b)("p",{parentName:"li"},"If a package has a stylesheet, it will always under a file named ",Object(i.b)("inlineCode",{parentName:"p"},"style.css")," and can be imported by doing ",Object(i.b)("inlineCode",{parentName:"p"},"import @bangle.dev/xyz-module/style.css"),"."))))}s.isMDXComponent=!0},156:function(e,t,n){"use strict";n.d(t,"a",(function(){return b})),n.d(t,"b",(function(){return m}));var r=n(0),a=n.n(r);function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function c(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){i(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},i=Object.keys(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var p=a.a.createContext({}),s=function(e){var t=a.a.useContext(p),n=t;return e&&(n="function"==typeof e?e(t):c(c({},t),e)),n},b=function(e){var t=s(e.components);return a.a.createElement(p.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return a.a.createElement(a.a.Fragment,{},t)}},d=a.a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,i=e.originalType,o=e.parentName,p=l(e,["components","mdxType","originalType","parentName"]),b=s(n),d=r,m=b["".concat(o,".").concat(d)]||b[d]||u[d]||i;return n?a.a.createElement(m,c(c({ref:t},p),{},{components:n})):a.a.createElement(m,c({ref:t},p))}));function m(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var i=n.length,o=new Array(i);o[0]=d;var c={};for(var l in t)hasOwnProperty.call(t,l)&&(c[l]=t[l]);c.originalType=e,c.mdxType="string"==typeof e?e:r,o[1]=c;for(var p=2;p<i;p++)o[p]=n[p];return a.a.createElement.apply(null,o)}return a.a.createElement.apply(null,n)}d.displayName="MDXCreateElement"}}]);