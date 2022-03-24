import html from 'html';
import { createContext } from 'preact';
import { useState, useEffect, useCallback, useContext } from 'preact/hooks';

const Loading = () => html`<div class="loading">...</div>`;

const imported = {};

const RouteContext = createContext();

export const Link = ({ href, children }) => {
  const { setLocation } = useContext(RouteContext);
  const onClick = useCallback((e) => {
    history.pushState({}, null, href);
    setLocation(href);
    e.preventDefault();
    return false;
  }, [href]);
  return html`<a onClick=${onClick} href="${href}">${children}</a>`;
};

export const Back = ({ children }) => {
  const onClick = useCallback((e) => {
    history.go(-1);
    e.preventDefault();
    return false;
  }, []);
  return html`<a onClick=${onClick} href="#back">${children}</a>`;
};

const normPath = href => new URL(href, window.origin).pathname.replace(/^\//, '');

const resolve = (root, href) => {
  const normHref = normPath(href);
  const normRoot = new URL(root, window.origin).pathname;
  const result = `${normRoot.replace(/\/$/, '')}/${normHref}`;
  return result.endsWith('/') ? `${result}/index` : result;
};

export const Router = ({ root }) => {
  const [path, setPath] = useState(normPath(window.location.pathname));
  const [Component, setComponent] = useState(() => Loading);
  
  useEffect(() => {
    const onPopState = () => {
      setPath(normPath(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popState', onPopState);
  }, [setPath]);

  useEffect(() => {
    const route = path ? resolve(root, path) : resolve(root, 'index');
    if (imported[route]) {
      setComponent(() => imported[route]);
    } else {
      setComponent(() => Loading);
      import(`${route}.js`).then(imports => {
        if (!imports.default) {
          throw new Error(`Bad route: ${route} does not have a default export`);
        }
        imported[route] = imports.default;
        setComponent(() => imported[route]);
      });
    }
  }, [path]);
  return html`<${RouteContext.Provider} value=${{ setLocation: setPath }}><${Component} /></>`;
};

export default Router;