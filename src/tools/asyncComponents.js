import { createElement } from 'preact';
import { useEffect, useState } from 'preact/hooks';

export default (promisor, Loading = Blank) => {
  let cachedPromise = null;
  return new Proxy({}, {
    get: (_, name) => props => {
      const [{ Comp }, setComp] = useState({ Comp: Loading });
      useEffect(() => {
        if (!cachedPromise) cachedPromise = promisor();
        cachedPromise.then(mod => {
          if (!(name in mod)) {
            console.warn(`Cannot find ${name} in ${Object.keys(mod)}!`);
            setComp({ Comp: () => null });
          } else {
            setComp({ Comp: mod[name] });
          }
        });
      }, []);
      return createElement(Comp, props);
    },
  });
};