/**
 * # `makeResolver`
 * 
 * ```javascript
 * const resolver = makeResolver(import.meta.url);
 * ```
 * 
 * Creates a resolver relative to a given URL.  Typically, this is
 * `import.meta.url`, so you can resolve assets relative to the current
 * file instead of the browser's location.  You can also just pass
 * `import.meta`.
 * 
 * The return value is a function that converts a relative URI to an absolute URL.
 * 
 * ## Example usage:
 * 
 * ```javascript
 * // src/PrettyPicture/index.js
 * import makeResolver from 'makeResolver';
 * 
 * const resolver = makeResolver(import.meta.url);
 * const prettyPicture = resolver('./pretty-picture.png');
 * 
 * export default () => html`
 *   <img src=${prettyPicture} />
 * `;
 * ```
 * 
 * If you're only going to use it once, you don't need to make the actual resolver:
 * 
 * ```javascript
 * import resolver from 'makeResolver';
 * 
 * const prettyPicture = resolver(import.meta, './pretty-picture.png');
 * export default () => html`
 *   <img src=${prettyPicture} />
 * `;
 * ```
 * 
 */

/**
 * @callback Resolver
 * @param {String} relativeUri a relative URI
 * @returns {String} An absolute URL
 */

/**
 * @function makeResolver
 * Create a resolver relative to a given URL
 * Typical usage:
 *   const resolver = makeResolver(import.meta.url);
 *   const pictureUrl = resolve('./pretty-picture.png');
 * 
 * @param {String} baseUrl base url to resolve to
 * @param {String} [relativeUrl] url to resolve.  makeResolver returns a string if this is present.
 * @returns {String|Resolver} resolver to the given baseUrl
 */
export default (baseUrlOrMeta, relativeUrl) => {
  const base = baseUrlOrMeta?.url || baseUrlOrMeta;
  const resolver = (uri) => new URL(uri, base).toString();
  if (relativeUrl !== undefined) {
    return resolver(relativeUrl);
  }
  return resolver;
};
