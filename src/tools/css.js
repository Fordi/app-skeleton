/**
 * # `css`
 * 
 * ```javascript
 * import css from 'css';
 * 
 * const { widget } = css`
 *   .widget {
 *     property: value;
 *     another-property: anotherValue;
 *   }
 * `;
 * ```
 * 
 * This is a minimalist CSS-in-JS tagged template that seeks to provide the same
 * benefit as CSS modules as they exist in a webpack/node build environment, but
 * lets you work on a component's CSS co-located with the component, and running
 * natively in-browser.
 * 
 * Accepts a simple templated stylesheet.  `css` adds a unique slug to each class
 * name in the stylesheet, injects it into the document, and returns an object
 * mapping the original class names to their slugged values, wrapped in a
 * `classes` object.
 * 
 * ## Example:
 * 
 * ```javascript
 * import { html, css } from 'https://unpkg.com/@fordi-org/buildless';
 * import { colors } from './theme.js'
 * const styles = css`
 *   .about {
 *     background: ${colors.background};
 *     color: ${colors.text};
 *   }
 * `;
 * 
 * export default ({ isBlue }) => html`
 *   <article className=${styles.about.and('some-other-style', isBlue && 'about--blue')}>
 *     <h1>About</h1>
 *     <p>
 *       Neat stuff goes here
 *     </p>
 *   </article>
 * `;
 * ```
 */

import classes from './classes.js';

const createStylesheet = (str) => {
  const rid = Math.random().toString(36).substr(2);
  const cssRules = parseRules(str);
  const styles = {};
  cssRules.forEach(rule => Object.assign(styles, insertRule(rule, rid)));
  Object.keys(styles).forEach(name => {
    styles[name] = classes(styles[name])
  });
  return styles;
};

const head = document.querySelector('head');
const { sheet } = head.appendChild(document.createElement('style'));

const clsRx = /\.([^ \.\[:>,]+)/g;
export default (...args) => createStylesheet(String.raw(...args));

const appendId = (str, id) => str.endsWith(`_${id}`) ? str : `${str}_${id}`;
const aniKwRx = /infinite|none|forwards|backwards|both|paused|running|normal|reverse|alternate-normal|alternate-reverse/;

const insertRule = (rule, id) => {
  const classNames = allRules(rule).reduce((cls, r) => {
    if (r.type === CSSRule.KEYFRAMES_RULE) {
      r.name = appendId(r.name, id);
    }
    if (r.style) {
      if (r.style['animation-name']) {
        r.style['animation-name'] = r.style['animation-name'].split(',').map(p => appendId(p.trim(), id)).join(',');
      }
      if (r.style.animation) {
        r.style.animation = r.style.animation.replace(/,[\s\r\n\t]+/g, ',').split(/[\s\r\n\t]+/).map(part => {
          // Can have multiple values
          const [piece, ...pieces] = part.split(',');
          // Starts with a number; it's a time value or iteration count
          if (/^[\.0-9]/.test(piece)) return part;
          // keywords
          if (aniKwRx.test(piece)) return part;
          // Not a keyword or numeric; it's an ID.
          return [piece, ...pieces].map(p => appendId(p.trim(), id)).join(',');
        }).join(' ');
      }
    }
    if (r.selectorText) {
      r.selectorText = r.selectorText.replace(clsRx, (_, m) => {
        cls[m] = appendId(m, id);
        return `.${cls[m]}`;
      });
    }
    return cls;
  }, {});
  sheet.insertRule(rule.cssText);
  return classNames;
};

const allRules = a => (
  a.selectorText
    ? [a]
    : Array.from(a.cssRules || []).reduce((list, rule) => (
      [a, ...list, ...allRules(rule)]
    ), [])
);

const parseRules = css => {
  const t = document.createElement('style');
  t.textContent = css;
  head.appendChild(t);
  const r = t.sheet;
  head.removeChild(t);
  return Array.from(r.cssRules);
};
