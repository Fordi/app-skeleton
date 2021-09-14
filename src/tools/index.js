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
  const self = { ...machine, machine, action };

  Object.keys(children).forEach(name => add(name, children[name]));

  return self;
};