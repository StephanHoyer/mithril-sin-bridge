import m from "./index.js";

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
