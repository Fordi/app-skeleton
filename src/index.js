import { render, createElement } from 'preact';
import PathRouter from 'PathRouter';

render(createElement(PathRouter, { root: '/pages' }), document.body);
document.body.classList.add('loaded');
