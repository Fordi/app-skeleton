import { useState, useEffect } from "preact/hooks";
/**
 * Think of it like a Redux store, but easier to use.
 * 
 * @see /examples/StateMachine/index.js for usage.
 **/

const ACTION_TYPE = ({ async *test() { } }).test.constructor;

export default (initialState, children = {}) => {
  let state = { ...initialState };
  let logging = false;
  const actions = {};
  const kids = {...children};
  const listeners = {
    complete: new Set(),
    step: new Set(),
  };

  const announce = (type, newState, oldState, path = []) => (
    listeners[type].forEach(listener => listener(newState, oldState, type, path))
  );

  const getState = (up = 0) => (
    (up === 0 || !self.parent) 
      ? state
      : self.parent.getState(up - 1)
  );

  const act = async (iter, name) => {
    const initState = state;
    for await (const newState of iter) {
      const interState = state;
      state = newState;
      logging && console.info(`[${name} step]`, interState, state);
      announce('step', state, interState);
    }
    const final = (await iter.return()).value;
    logging && console.info(`[${name} complete]`, initState, state);
    announce('complete', state, initState);
    return final;
  };

  const action = fn => {
    if (typeof fn === 'object' && Object.keys(fn).length === 1) {
      return action(fn[Object.keys(fn)[0]]);
    }
    if (!fn || !fn.name || fn.constructor !== ACTION_TYPE) {
      console.warn('Actions MUST be of the form `async function* actionName() { ... }` or `{ async *actionName() { ... } }`');
    }
    actions[fn.name] = (...args) => {
      logging && console.info(`[${fn.name} init]`, state);
      const ret = act(fn(self, ...args), fn.name);
      return ret;
    };
    return actions[fn.name];
  };

  const add = (name, child) => {
    child.parent = self;
    kids[name] = machine;
    Object.defineProperty(actions, name, {
      enumerable: true,
      configurable: true, 
      get: () => child.actions,
    });
    state[name] = child.getState();
    ['step', 'complete'].forEach(type => {
      child.listen(type, (newState, _, path) => {
        const oldState = state;
        state[name] = newState;
        announce(type, state, oldState, [name, ...path]);
      });
    });
  };

  const listen = (type, listener) => {
    if (typeof type === 'function') {
      const unlisteners = ['step', 'complete'].map(t => listen(t, type));
      return () => unlisteners.forEach(u => u());
    }
    listeners[type]?.add(listener);
    return () => listeners[type]?.delete(listener);
  };

  const select = selector => () => {
    const [value, setValue] = useState(selector(getState()));
    useEffect(() => listen('step', (newState, oldState) => {
      const gnu = selector(newState);
      const old = selector(oldState);
      if (gnu !== old) setValue(gnu);
    }), [selector]);
    return value;  
  };

  const log = v => logging = v;

  // Public stuff
  const machine = { getState, act, listen, log };

  // Stuff you'll need for making actions
  const self = { ...machine, machine, action, select };

  Object.keys(kids).forEach(name => add(name, kids[name]));

  return self;
};
