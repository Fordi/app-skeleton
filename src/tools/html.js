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
import { h } from 'preact';
import htm from 'htm';
export default htm.bind(h);
