/**
 * ```javascript
 * import html from `html`';
 * 
 * const Loading = () => html`
 *   <div className="load-throbber">Loading...</div>
 * `;
 * 
 * export default Loading;
 * ```
 * 
 * A Preact-enabled tagged template supporting Hypertext Tagged Markup (HTM).
 */
import { createElement, Fragment } from './reactor.js';
import htm from 'htm';

const htmlRaw = htm.bind(createElement);

// This is needed to suppress "every item in a list must have a key" errors in React when
//  rendering something like html`<hr /><hr />` (e.g., treating the template as a fragment)
const html = (...args) => {
  const result = htmlRaw(...args);
  if (!Array.isArray(result)) return result;
  return createElement(Fragment, null, ...result);
};

export default html;
