import { getReactor } from './reactor-core.js';
const reactor = getReactor();
export const {
  createContext,
  createElement,
  Fragment,
  render,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} = reactor;
export default reactor;