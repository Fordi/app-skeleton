const reactor = {};
export const setReactor = ({
  createContext,
  createElement,
  Fragment,
  render,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
}) => {
  Object.assign(reactor, {
    createContext,
    createElement,
    Fragment,
    render,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
  })
};
export const getReactor = () => reactor;
