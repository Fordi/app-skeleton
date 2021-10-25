/**
 * # `makeResolver`
 * 
 * ```javascript
 * const resolver = makeResolver(import.meta.url);
 * ```
 * 
 * Creates a resolver relative to a given URL.  Typically, this is
 * `import.meta.url`, so you can resolve assets relative to the current
 * file instead of the browser's location.
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
 * const prettyPicture = resolve('./pretty-picture.png');
 * 
 * export default () => html`
 *   <img src=${prettyPicture} />
 * `;
 * ```
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
 * @returns {Resolver} resolver to the given baseUrl
 */
 const makeResolver = baseUrl => relativeUri => new URL(relativeUri, baseUrl).toString();

 export default makeResolver;
