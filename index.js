import s from "sin";

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
      view: () => {},
    };
  }

  if (tag.view) {
    return s(() => {
      const vnode = { state: {}, attrs, children };
      tag.oninit?.(vnode);
      let onupdate = () => {
        attrs.oncreate?.(vnode);
        tag.oncreate?.(vnode);
        onupdate = () => {
          attrs.onupdate?.(vnode);
          tag.onupdate?.(vnode);
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

  if (
    attrs.oncreate ||
    attrs.onupdate ||
    attrs.onbeforeupdate ||
    attrs.onbeforeremove
  ) {
    return s(({}, [], { ignore }) => {
      const vnode = { attrs, children };
      return (attrs, children) => {
        vnode.children = children;
        vnode.attrs = attrs;
        attrs.onbeforeupdate && ignore(!attrs.onbeforeupdate(vnode));
        return s(
          tag,
          {
            ...attrs,
            dom: (dom) => {
              vnode.dom = dom;
              attrs.oncreate?.(vnode);
              return () => attrs.onbeforeremove?.(vnode);
            },
          },
          vnode.dom && (() => (attrs.onupdate?.(vnode), null)),
          vnode.children
        );
      };
    })(attrs, children);
  }

  return s(tag, attrs, ...children);
};

m.route = (dom, defaultRoute, routes) => {
  if (dom)
    console.warn("mounting to other than document.body is not supported atm");
  const sRoutes = { "*": () => s.route(defaultRoute) };
  for (const path in routes) {
    sRoutes[path] = (params) => m(routes[path], params);
  }
  return s.mount(({}, [], { route }) => route(sRoutes));
};
m.mount = (dom, comp) => {
  if (dom)
    console.warn("mounting to other than document.body is not supported atm");
  s.mount(() => m(comp));
};

/// test

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

let showOnBeforeRemove = true;

const home = {
  view: () => [
    m(`h1`, "Welcome to mithril-sin"),
    m("a", { href: "/about" }, "About"),
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
      "with oncreate/onupdate hook",
      new Date()
    ),
    m(
      "p",
      {
        onbeforeupdate: (vnode) => {
          console.log("onbeforeupdate", vnode.dom);
          return false;
        },
      },
      "with onbeforeupdate hook (should not update)",
      new Date()
    ),
    m("p", "no hook", new Date()),
    showOnBeforeRemove
      ? m(
          "p",
          {
            onbeforeremove: (vnode) => {
              console.log("onbeforeupdate", vnode.dom);
              return new Promise((res) => setTimeout(res, 1000));
            },
          },
          "with onbeforeremove",
          m(
            "button",
            { onclick: () => (showOnBeforeRemove = false) },
            "remove after 1s"
          )
        )
      : m("button", { onclick: () => (showOnBeforeRemove = true) }, "restore"),
    (console.log("redraw"), null),
  ],
};

export default m.route(null, "/", {
  "/": home,
  "/about": {
    view: () => [
      m("h1", "About"),
      m("a", { href: "/" }, "Home"),
      m("a", { href: "/thing/1" }, "Thing 1"),
      m("a", { href: "/thing/2" }, "Thing 2"),
    ],
  },
  "/thing/:id": {
    view: ({ attrs }) => [
      m("h1", `Thing ${attrs.id}`),
      m("a", { href: "/thing/1" }, "Thing 1"),
      m("a", { href: "/thing/2" }, "Thing 2"),
      m("a", { href: "/xxx" }, "xxx"),
    ],
  },
});
