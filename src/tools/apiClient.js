/**
 * # `apiClient`
 * 
 * ```javascript
 * import apiClient from 'api-client';
 * 
 * const myApiClient = apiClient((url, init) => {
 *   init.headers['X-My-Authorization'] = 'my-secret-key';
 *   return [url, init];
 * });
 * 
 * const data = await myApiClient('/articles');
 * ```
 * 
 * `apiClient` is a wrapper around `fetch` that lets you uniformly decorate requests before sending them
 * (for things like authentication) and automatically converts their responses into data, converting bad
 * responses to errors appropriately.
 * 
 * To use it, create a new client by calling `apiClient` with a function that will decorate the
 * passed object as needed.
 * 
 * Objects are not copied, so be careful: it's possible to inadvertently expose security credentials to
 * consuming functions.  If you're going to be making an API client that any code but your own is likely
 * to consume, you'll want to work around that by using a more Redux-like method of modifying objects:
 * 
 * ```javascript
 * import apiClient from 'api-client';
 * 
 * const myApiClient = apiClient((url, { headers, ...init }) => [
 *   url,
 *   {
 *     ...init,
 *     headers: {
 *       ...headers,
 *       'X-My-Authorization': 'my-secret-key'
 *     },
 *   },
 * ];
 * ```
 * 
 * Also exposed is the un-decorated `fetchData` function (equivalent to `apiClient(request => request)`).
 * 
 * HTTP Errors are rejected, as an `HttpError` object.  The body from these errors, if present, is
 * available on `HttpError.data`, as are `status` and `statusText`.  Parsing errors are rejected
 * directly.
 * 
 * Currently, `apiClient` supports XML and JSON data types, as determined by the response's
 * `content-type` header.  If the response is not XML or JSON, but is of major type `text`, the raw
 * text will be returned as a string.  Any other data is returned as an ArrayBuffer.
 */
export class HttpError extends Error {
  constructor(status, statusText, data) {
    super(`HTTP ${status} ${statusText}`);
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

const decodeResponse = async response => {
  const { headers } = response;
  const [type, subType] = headers.get('content-type').split(/; */)[0].split('/');
  const lang = subType.indexOf('+') === -1 ? subType : subType.split('+')[1];
  if (lang === 'json') return response.json();
  if (lang === 'xml') return new DOMParser().parseFromString(await response.text(), 'text/xml');
  if (type === 'text') return response.text();
  return response.arrayBuffer();
};

/**
 * @callback FetchDataImpl
 * @param {String} resource
 * @param {object} init
 * @return {Promise<*, Error>} The parsed response, or an Error describing the problem encountered
 */


/**
 * @implements FetchDataImpl
 */
const fetchData = async (url, { body, headers, ...props } = {}) => {
  const response = await fetch(url, {
    ...props,
    ...(body && {
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers: {
        ...(typeof body !== 'string' && { 'content-type': 'application/json' }),
        ...headers
      },
    }),
    ...(!body && { headers })
  });
  const { ok, status, statusText } = response;
  const data = await decodeResponse(response);
  if (!ok) throw new HttpError(status, statusText, data);
  return data;
};

/**
 * Information about a request
 * @typedef {Object} RequestInfo
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
 * @property {String} requestInfo.resource
 * @property {object} requestInfo.init
 */

/**
 * This callback should decorate a request with API-specific information
 * @callback RequestDecorator
 * @param {RequestInfo} requestInfo The request to decorate
 * @return {RequestInfo} The decorated request
 */

/**
 * Construct an API client
 * @param {RequestDecorator}
 * @return {FetchDataImpl}
 */
const apiClient = (decorator) => (url, initializer) => fetchData(...decorator(url, initializer));

export default apiClient;