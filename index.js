import s from "sin";
const m = (tag, ...children) => {
  let attrs = {};
  if (typeof children[0] === "object") {
    [attrs, ...children] = children;
  }
  if (tag.view) {
    return s(() => {
      const vnode = { state: {}, attrs, children };
      tag.oninit?.(vnode);
      return () => tag.view(vnode);
    });
  }
  if (typeof tag === "function") {
    return s(() => {
      const vnode = { attrs, children };
      const view = tag(vnode).view;
      return () => view(vnode);
    });
  }
  if (attrs.oncreate || attrs.onupdate) {
    return s(() => {
      const vnode = { attrs, children };
      return () =>
        s(
          tag,
          {
            ...attrs,
            dom: (dom) => {
              vnode.dom = dom;
              attrs.oncreate?.(vnode);
            },
          },
          vnode.dom && (() => (attrs.onupdate?.(vnode), null)),
          ...vnode.children
        );
    });
  }
  return s(tag, attrs, ...children);
};

m.mount = (dom, comp) => s.mount(dom, () => m(comp));

const closure = (vnode) => {
  let count = vnode.attrs.initial;
  return {
    view: () => [
      m("h1", "Closure"),
      m("p", `Count: ${count}`),
      m("button", { onclick: () => count++ }, "Increment"),
    ],
  };
};

const pojo = {
  oninit: (vnode) => {
    vnode.state.count = vnode.attrs.initial;
  },
  view: (vnode) => [
    m("h1", "POJO"),
    m("p", `Count: ${vnode.state.count}`),
    m("button", { onclick: () => vnode.state.count++ }, "Increment"),
  ],
};

m.mount(document.body, {
  view: () => [
    m(`h1`, "Welcome to mithril-sin"),
    m(closure, { initial: 10 }),
    m(pojo, { initial: 20 }),
    m("p", { style: { color: "red" } }, "with Style"),
    m(
      "p",
      {
        oncreate: (vnode) => {
          console.log("oncreate", vnode.dom);
        },
        onupdate: (vnode) => {
          console.log("onupdate", vnode.dom);
        },
      },
      "with Hook"
    ),
    (console.log("redraw"), null),
  ],
});

const things = [
  s(() => {
    let el;
    return () => {
      el && console.log("update", el.offsetWidth);
      return s(
        ".thing",
        {
          dom: (_el) => {
            el = _el;
            console.log("create", el.offsetWidth);
          },
        },
        "thing"
      );
    };
  }),
  s(() => {
    const node = s(
      ".thing",
      { dom: () => console.log("create", node) },
      "thing"
    );
    return () => {
      console.log("update", node);
      return node;
    };
  }),
];
