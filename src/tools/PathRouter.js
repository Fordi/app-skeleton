import html from 'html';
import { h, createContext } from 'preact';
import { useState, useEffect, useCallback, useContext } from 'preact/hooks';

const DefaultLoading = () => h('div', { class: 'loading' }, 'Loading...');
const DefaultError = ({ error }) => h('div', { class: 'error' },
  h('h1', null, error.type || error.constructor.name),
  error.message,
  h('pre', null, error.stack),
);

const imported = {};

/**
 * Context for the router
 */
const RouteContext = createContext();

export const useRoute = () => useContext(RouteContext);

/**
 * 
 * @param {object} props
 * @param {string} props.to URL for link
 * @param {Array} props.children
 * @return {Array} rendered DOM representation of a routable link
 */
export const Link = ({ to, children }) => {
  const { setLocation } = useRoute();
  const onClick = useCallback((e) => {
    history.pushState({}, null, to);
    setLocation(to);
    e.preventDefault();
    return false;
  }, [to]);
  return h('a', { onClick, href: to }, children);
};

/**
 * 
 * @param {object} props
 * @param {string} props.to URL for link
 * @param {Array} props.children
 * @return {Array} rendered DOM representation for a "Back" link
 */
 export const Back = ({ children }) => {
  const onClick = useCallback((e) => {
    history.go(-1);
    e.preventDefault();
    return false;
  }, []);
  return h('a', { onClick, href: '#back' }, children);
};

const normPath = href => new URL(href, window.origin).pathname.replace(/^\//, '');

const resolve = (root, href) => {
  const normHref = normPath(href);
  const normRoot = new URL(root, window.origin).pathname;
  const result = `${normRoot.replace(/\/$/, '')}/${normHref}`;
  return result.endsWith('/') ? `${result}index` : result;
};
const keyRx = /\/[:\*][a-zA-Z_][0-9a-zA-Z_]*/g;

const createMatcher = patterns => {
  const matchers = patterns.map(pattern => {
    const keys = [];
    let complexity = 0;
    const routeRx = new RegExp(`^${
      pattern.replace(/^\//, '').replace(keyRx, (key) => {
        keys.push(key.substring(2));
        if (key[1] === ':') {
          complexity += 1;
          return '\/([^\/]+)';
        }
        complexity += 2;
        return '\/(.*)';
      })
    }$`);
    const matcher = location => {
      if (!routeRx.test(location)) return null;
      const data = location.match(routeRx).slice(1);
      return [
        pattern
          .replace(/^\//, '') // Remove leading slash
          .replace(keyRx, ''), // Remove keys
        keys.reduce((obj, key, index) => {
          obj[key] = data[index];
          return obj;
        }, {}),
      ];
    };
    return { matcher, keys, pattern, complexity, rx: routeRx };
  })
    .sort((a, b) => b.complexity - a.complexity);
  const RV = location => {
    for (let i = 0; i < matchers.length; i++) {
      const m = matchers[i].matcher(location);
      if (m) return m;
    }
    return [];
  };
  RV.matchers = matchers;
  return RV;
};

/**
 * Router that works for a subdirectory of pages.
 * The default root is `/pages` for the server, but it can be any root.
 * @param {object} props
 * @param {string} props.root Root URL for routes
 * @param {Component} [props.loading=DefaultLoading] Component to display while loading new route.
 * @param {Component} [props.loading=DefaultError] Component to display if component could not be loaded.
 * @return {Array} Rendered route
 */
export const PathRouter = ({
  root = '/pages',
  loading: Loading = DefaultLoading,
  error: Error = DefaultError,
  patterns = [],
}) => {
  const [location, setLocation] = useState(normPath(window.location.pathname));
  const [Component, setComponent] = useState(() => Loading);
  const [props, setProps] = useState(null);
  const [matcher, setMatcher] = useState(() => createMatcher(patterns));

  useEffect(() => {
    setMatcher(() => createMatcher(patterns));
  }, [patterns]);

  useEffect(() => {
    const onPopState = () => {
      setLocation(normPath(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popState', onPopState);
  }, [setLocation]);

  useEffect(() => {
    const [matched, matchProps = {}] = matcher(location);
    const route = matched ? resolve(root, matched) : (
      location ? resolve(root, location) : resolve(root, 'index')
    );
    if (matched) {
      setProps(matchProps);
    }
    
    if (imported[route]) {
      setComponent(() => imported[route]);
    } else {
      setComponent(() => Loading);
      const url = `${route}.js`;
      import(url).then(imports => {
        if (!imports.default) {
          setComponent(() => () => h(Error, { error: new Error(`Bad route: ${route} does not have a default export`) }));
        } else {
          imported[route] = imports.default;
          setComponent(() => imported[route]);
        }
      })
      .catch(error => {
        if (error.constructor === TypeError && /import/.test(error.message)) {
          setComponent(() => () => h(Error, {
            error: Object.assign(new Error('Not Found'), {
              status: 404,
              stack: `404 Not Found: ${url}`,
            })
          }));
        } else {
          setComponent(() => () => h(Error, { 
            error: Object.assign(error, { 
              // Add source to tail of stack.
              stack: error.stack.split('\n').length === 1 ? [error.stack, `    in ${url}`].join('\n') : error.stack,
            }),
          }));
        }
        throw error;
      });
    }
  }, [location, matcher]);

  return h(RouteContext.Provider, { value: { setLocation } },
    h(Component, props),
  );
};

export default PathRouter;