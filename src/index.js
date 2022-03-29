// Import this first to use preact as the rendering engine.
import 'reactor/preact';
// If you want React instead, use this.
// import 'reactor/react';
import PathRouter from 'PathRouter';
import html from 'html';
import { render } from 'reactor';

render(html`
  <${PathRouter}
    root="/pages"
    patterns=${[
      // -> /pages/test.js { id: ... }
      '/test/:id',
      // -> /pages/test/index.js { id: ... }
      '/test/:id/',
      // -> /pages/test/details.js { id: ... }
      '/test/:id/details',
      // -> /pages/test/details.js { id: ..., name: ... }, supports `/` in `name`
      '/test/:id/details/*name',
      // -> /pages/test/index.js { id: ... }, supports `/` in `id`
      '/test/*id/',
    ]}
  />
`, document.querySelector('#root'));

document.body.classList.add('loaded');
