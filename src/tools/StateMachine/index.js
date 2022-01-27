/**
 * Think of it like a Redux store, but easier to use.
 *
 * Defining the machine:
 * 
 * ```javascript
 * import StateMachine from 'state-machine';
 * 
 * const myMachine = new StateMachine({
 *   loadState: 'new',
 *   data: null,
 *   error: null,
 *   children: {
 *     // You can define subMachines here
 *     subState: importedMachine,
 *   },
 * });
 * 
 * // A complex action with intermediate work 
 * export const doTheThing = myMachine.action(async function* doTheThing() {
 *   yield { loadState: 'loading', error: null };
 *   try {
 *     // Yield a new result to update the state
 *     yield {
 *       loadState: 'ready',
 *       data: await fetch('/endpoint').then(r => r.json())
 *     };
 *   } catch (error) {
 *     yield {
 *       loadState: 'error',
 *       data: null,
 *       error
 *     };
 *   };
 * });
 * 
 * // The simplest form of action
 * export const reset = myMachine.action(async function* reset() {
 *   return { loadState: 'new', data: null };
 * });
 * 
 * export default myMachine;
 * ```
 *
 * Using the machine:
 * 
 * ```javascript
 * import { useEffect } from 'preact/hooks';
 * import html from 'html';
 * import useSelector from 'StateMachine/useSelector';
 * import { doTheThing } from './myMachine.js';
 * 
 * const MyComponent = (props) => {
 *   // The selector could be more complex, but for now, just dump the state and destruct
 *   const { loadState, data, error } = useSelector(state => state);
 *   // run an action if needed
 *   useEffect(() => {
 *     if (loadState === 'new') {
 *       doTheThing();
 *     }
 *   }, [loadState]);
 * 
 *   // Normal template stuff
 *   if (loadState === 'new' || loadState === 'loading') {
 *     return html`<div className="loading">Loading...</div>`;
 *   }
 *   if (loadState === 'error') {
 *     return html`<div className="error">${error.message}</div>`;
 *   }
 *   return html`<pre>${JSON.strinigfy(data, null, 2)}</pre>`;
 * }
 **/

const ACTION_TYPE = (async function*() { }).constructor;

export default function StateMachine(initialState, children = {}) {
  let state = { ...initialState };
  const actions = {};
  const children = {};
  const listeners = {
    complete: new Set(),
    step: new Set(),
  };

  const announce = (type, newState, oldState, path = []) => (
    listeners[type].forEach(listener => listener(newState, oldState, path))
  );

  const getState = (up = 0) => (
    (up === 0 || !self.parent) 
      ? state
      : self.parent.getState(up - 1)
  );

  const act = iterator => {
    const initState = state;
    for await (let newState of iterator) {
      const interState = state;
      state = newState;
      announce('step', state, interState);
    }
    const final = (await iterator.return()).value;
    announce('complete', state, initState);
    return final;
  };

  const action = fn => {
    if (!fn || !fn.name || fn.constructor !== ACTION_TYPE) {
      console.warn('Actions MUST be of the form `async function* actionName() { ... }`');
    }
    actions[fn.name] = (...args) => act(fn(self, ...args));
    return actions[fn.name];
  };

  const add = (name, child) => {
    child.parent = self;
    children[name] = machine;
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
    listeners[type] && listeners[type].add(listener);
    return () => (listeners[type] && listeners[type].remove(listener));
  };

  // Public stuff
  const machine = { getState, act, listen };

  // Stuff you'll need for making actions
  const self = { ...machine, machine, action, add };

  Object.keys(children).forEach(name => add(name, children[name]));

  return self;
};