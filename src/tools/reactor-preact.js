import { setReactor } from './reactor-core.js';
import { 
  createContext,
  createElement,
  render,
} from 'preact';
import {
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'preact/hooks';

setReactor({
  createContext,
  createElement,
  render,
  Fragment: ({ children }) => children,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
});