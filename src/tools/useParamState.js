import { useState, useEffect } from 'preact/hooks';

/**
 * @type ParamStringifier
 */
export const defaultStringify = (state) => {
  if (state === undefined) return undefined;
  if (state === null) return 'null';
  const type = typeof state;
  const isNumber = type === 'number';
  if (isNumber) {
    if (Number.isNaN(state)) return undefined;
    if (Number.isInteger(state)) {
      return state.toString();
    }
    const float = state.toString();
    return float.indexOf('.') !== -1 ? float : `${float}.0`;
  }
  if (type === 'boolean') {
    return state.toString();
  }
  if (type === 'string') {
    if (state[0] === '"' && state[state.length - 1] === '"') {
      return JSON.stringify(state);
    }
    return state.toString();
  }
  if (state instanceof Date) {
    const date = state.toISOString();
    if (/T00:00:00\.000Z$/.test(date)) return date.substring(0, 10);
    return date;
  }
  return JSON.stringify(state);
};
const isoDateRx = /^\d{4}-\d{2}-\d{2}(T\d{2}(:\d{2}(:\d{2}(.\d{3}Z?)?)?)?)?$/;
const numberRx = /^-?\d+(\.\d*)?(e-?\d+)?$/;

/**
 * @type ParamParser 
 */
export const defaultParse = (param) => {
  param = param.trim();
  if (param === 'undefined') return undefined;
  if (param === 'null') return null;
  if (param === 'true' || param === 'false') {
    return param === 'true';
  }
  const first = param[0];
  const last = param[param.length - 1];
  if (
    (first === '{' && last === '}')
    || (first === '[' && last === ']')
    || (first === '"' && last === '"')
   ) {
    return JSON.parse(param);
  }
  if (isoDateRx.test(param)) {
    return new Date(Date.parse(param));
  }
  if (numberRx.test(param)) {
    const int = parseInt(param);
    if (int.toString() === param) {
      return int;
    }
    return parseFloat(param);
  }
  return param;
};

/**
 * @function useParamState
 * Store state in query parameters
 * @param initialState {String} initial state
 * @param name {String} name of the param
 * @param [stringify=defaultStringify] {ParamStrinigfier} Serialization function
 * @param [parse=defaultParse] {ParamParser} Deserialization function
 * @return [ValueSetTuple] The state value and setter
 */
export default (
  initialState,
  name,
  stringify = defaultStringify,
  parse = defaultParse
) => {
  const strInit = stringify(initialState);
  const existingValue = new URL(window.location).searchParams.get(name);
  
  const [state, setState] = useState(
    existingValue ? parse(existingValue) : initialState
  );
  useEffect(() => {
    const update = () => {
      const updatedValue = new URL(window.location).searchParams.get(name);
      if (updatedValue && parse(updatedValue) !== state) {
        setState(parse(updatedValue));
      }  
    };
    window.addEventListener('popstate', update);
    window.addEventListener('hashchange', update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener('hashchange', update);  
    };
  }, [parse, setState]);
  useEffect(() => {
    const str = stringify(state);
    const url = new URL(window.location);
    if (str === undefined || str === strInit) {
      url.searchParams.delete(name);
    } else {
      url.searchParams.set(name, str);
    }
    const strUrl = url.toString();
    if (strUrl !== window.location.toString()) {
      history.pushState({}, null, strUrl);
    }
  }, [state, stringify]);
  useEffect(() => () => {
    const url = new URL(window.location);
    url.searchParams.delete(name);
    history.replaceState({}, null, url.toString());
  }, []);
  return [state, setState];
};

/**
 * @callback ParamStringifier
 * @param state {*} state to stringify
 * @returns {String} stringified state
 */

/**
 * @callback ParamParser
 * @param param {String} state to parse
 * @return {*} parsed state
 */

/**
 * @callback SetterFunction
 * @param {*} value new state value
 * @return {void}
 */

/**
 * @typedef {[*, SetterFunction]} ValueSetTuple
 */

