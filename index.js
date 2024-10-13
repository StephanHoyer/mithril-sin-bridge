import s from "sin";

function noop() {}

const m = (tag, ...children) => {
  let attrs = {};
  if (typeof children[0] === "object") {
    [attrs, ...children] = children;
  }
  // convert closure component to pojo component
  if (typeof tag === "function") {
    const oninit = tag;
    tag = {
      oninit: (vnode) => Object.assign(tag, oninit(vnode)),
      view: noop,
    };
  }

  if (tag.view) {
    return s(() => {
      const vnode = { state: {}, attrs, children };
      tag.oninit?.(vnode);
      let onupdate = () => {
        (attrs.oncreate || noop)(vnode);
        (tag.oncreate || noop)(vnode);
        onupdate = () => {
          (attrs.onupdate || noop)(vnode);
          (tag.onupdate || noop)(vnode);
        };
      };
      return () => {
        const res = tag.view(vnode);
        vnode.dom = res;
        onupdate();
        return res;
      };
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
    m(closure, {
      initial: 10,
      oncreate: (vn) => console.log("closure oncreate", vn),
      onupdate: (vn) => console.log("closure onupdate", vn),
    }),
    m(pojo, {
      initial: 20,
      oncreate: (vn) => console.log("pojo oncreate", vn),
      onupdate: (vn) => console.log("pojo onupdate", vn),
    }),
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
