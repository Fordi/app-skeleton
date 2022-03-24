import { render, createElement } from 'preact';
import PathRouter from 'PathRouter';

render(createElement(PathRouter, {
  root: '/pages',
  patterns: [
    // -> /pages/test.js { id: ... }
    '/test/:id',
    // -> /pages/test/index.js { id: ... }
    '/test/:id/',
    // -> /pages/test/details.js { id: ... }
    '/test/:id/details',
    // -> /pages/test/details.js { id: ..., name: ... }, supports `/` in `name`
    '/test/:id/details/*name',
    // -> /pages/test/details.js { id: ... }, supports `/` in `id`
    '/test/*id/',
  ],
}), document.body);
document.body.classList.add('loaded');
