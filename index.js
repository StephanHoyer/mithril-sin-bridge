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

export default m;
