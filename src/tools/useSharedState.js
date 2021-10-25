/**
 * # `useSharedState`
 *
 * ```javascript
 * import useSharedState from 'useSharedState';
 *
 * const [text, setText] = useSharedState('text', '');
 * ```
 *
 * Meant for use in place of `useState`, for when you need to coordinate state between different windows/tabs of the same app.
 *
 * ## Example usage:
 *
 * If the following micro-app is opened in more than one window, the content of the input field will always be the same regardless of use input.
 *
 * ```javascript
 * import useSharedState from 'useSharedState';
 *
 * export default () => {
 *   const [text, setText] = useSharedState('app-text', '');
 *   const onChange = ({ target: { value } }) => setText(value);
 *
 *   return html`<input value=${text} onChange=${onChange} />`;
 * };
 * ```
 */
import { useState, useEffect } from "preact/hooks";
import useEventListener from './useEventListener.js';

const { stringify, parse } = JSON;

/**
 * Use a state that is shared between instances of this app
 * @param {*} stateKey Key to be used in localStorage
 * @param {*} defaultValue Default value if localStorage
 * @return {Tuple<*, Function>} The current state and its update function.
 */
 export const useSharedState = (stateKey, defaultValue) => {
  // To initialize, set the state to the value in localStorage, or to the default.
  const [state, setState] = useState(() => {
    const stored = localStorage.getItem(stateKey);
    if (stored) {
      try {
        return parse(stored);
      } catch (e) {
        // fall through
      }
    }
    localStorage.setItem(stateKey, stringify(defaultValue));
    return defaultValue;
  });

  // Also for initialization, populate the JSON of the initial state to a local cache
  const [json, setJson] = useState(() => stringify(state));

  // During operation, any time the storage value changes, update the state if it != `json`.
  useEventListener(window, 'storage', ({ key, newValue }) => {
    if (stateKey !== key) return;
    if (newValue === json) return;
    try {
      setState(parse(newValue));
    } catch (e) {
      setState(defaultValue);
    }
  }, [stateKey, json, defaultValue]);

  // During operation, stringify new values for state to our JSON cache
  useEffect(() => setJson(stringify(state)), [state]);

  // During operation, any time `json` changes, update storage if the value has changed.
  useEffect(() => {
    if (json === localStorage.getItem(stateKey)) return;
    localStorage.setItem(stateKey, json);
  }, [json, stateKey]);

  return [state, setState];
};