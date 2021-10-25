import { useState, useEffect } from 'preact/hooks';
import { createElement } from 'preact';

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
 * })
 *   .addActions({
 *     // A complex action with intermediate work
 *     async *doTheThing() {
 *       yield { loadState: 'loading', error: null };
 *       try {
 *         // Yield a new result to update the state
 *         yield {
 *           loadState: 'ready',
 *           data: await fetch('/endpoint').then(r => r.json())
 *         };
 *       } catch (error) {
 *         yield {
 *           loadState: 'error',
 *           data: null,
 *           error
 *         };
 *       };
 *     },
 *     // The simplest form of action
 *     reset() {
 *       return { loadState: 'new', data: null };
 *     }
 *   })
 *   .addSubMachines({
 *     subMachine: new StateMachine({
 *       // ...
 *     }),
 *     imported: importedSubMachine,
 *   });
 * 
 * export default myMachine;
 * ```
 *
 * Using the machine:
 * 
 * ```javascript
 * import { useEffect } from 'preact/hooks';
 * import html from 'html';
 * 
 * import { useSelector, doTheThing } from './myMachine.js';
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
 * 
 * // Or, in class components (hisss)...
 * import { connect, doTheThing } from 'myMachine.js';
 * import html from 'html';
 * 
 * class MyCompoennt extends Component {
 *   componentDidMount() {
 *     if (this.props.loadState === 'new') {
 *       doTheThing();
 *     }
 *   }
 *   render() {
 *     const { loadState, data, error } = this.props;
 *     if (loadState === 'new' || loadState === 'loading') {
 *       return html`<div className="loading">Loading...</div>`;
 *     }
 *     if (loadState === 'error') {
 *       return html`<div className="error">${error.message}</div>`;
 *     }
 *     return html`<pre>${JSON.strinigfy(data, null, 2)}</pre>`;
 *   }
 * }
 * const mapStateToProps = ({ loadState, data, error }) => ({ loadState, data, error });
 * export default connect(mapStateToProps)(MyComponent);
 * ```
 **/

class StateMachine {
  #announce(type, actionName, newState, oldState, path = []) {
    this.#listeners[type].forEach(listener => listener(newState, oldState, path, actionName));
  }

  #state;
  #actions;
  #children;
  #listeners;
  #parent = null;

  /**
   * Create a new state machine
   **/
  constructor(initialState) {
    this.#state = { ...initialState };
    this.#actions = {};
    this.#children = {};
    this.#listeners = {
      complete: new Set(),
      step: new Set(),
      init: new Set(),
    };
    this.#parent = null;
    // Bind functions to self, so we don't have any `this` confusion.
    const descs = Object.getOwnPropertyDescriptors(this.constructor.prototype);
    Object.keys(descs).forEach(key => {
      if (key === 'constructor') return;
      const desc = descs[key];
      if (!('value' in desc)) return;
      if (!(this[key] instanceof Function)) return;
      this[key] = this[key].bind(this);
    });
  }

  /**
   * Get the set of actions appropriate for this machine.
   **/
  get actions() {
    return { ...this.#actions };
  }

  /**
   * Get the child machines for this machine
   **/
  get children() {
    return { ...this.#children };
  }

  get state() {
    return { ...this.#state };
  }

  /**
   * Get the current state of this machine
   **/
  getState(up = 0) {
    if (up === 0) {
      return this.state;
    }
    if (!this.#parent) {
      throw new Error('Requested parent state for root StateMachine');
    }
    return this.#parent.getState(up - 1);
  }

  /**
   * Define a set of actions
   * @param {Object<String, Function>} spec A hash of actions
   * Actions are functions that accept any set of arguments, and return changes to the state
   * Async actions are supported by default, as are generators.  If an action is a generator,
   * the action can `yield` state updates.
   * 
   * Defined actions will be available as functions on the machine itself, and on `machine.actions`
   * @returns {StateMachine} itself
   **/
  addActions(spec) {
    Object.keys(spec).forEach(actionName => {
      if (typeof this.constructor.prototype[actionName] === 'function') {
        throw new Error(`Action name "${actionName}" collides with StateMachine API; pick another name`);
      }
      this.#actions[actionName] = this[actionName] = async (...args) => {
        const initState = this.#state;
        this.#announce('init', actionName, initState, initState);
        const value = spec[actionName].apply(this, args);
        if (typeof value[Symbol.iterator] === 'function' || typeof value[Symbol.asyncIterator] === 'function') {
          for await (let newState of value) {
            const interState = this.#state;
            this.#state = { ...this.#state, ...newState };
            this.#announce('step', actionName, this.#state, interState);
          }
          const result = await value.return();
          if (result) {
            this.#state = { ...this.#state, ...result };
          }
        } else {
          this.#state = { ...this.#state, ...(await value) };
        }
        this.#announce('complete', actionName, this.#state, initState);
        return this.#state;
      };
    }, {});
    return this;
  }
  /**
   * Add submachines
   * @param {Object<String, StateMachine>} children a hash of submachines
   * Submachine states are proxied on the machine's state under their name,
   * and their actions are available under `machine.actions[name]`.
   * @returns {StateMachine} itself
   **/
  addSubMachines(children) {
    Object.keys(children).forEach(name => {
      const child = children[name];
      child.#parent = this;
      this.#children[name] = child;

      Object.defineProperty(this.#state, name, {
        enumerable: true,
        configurable: true,
        get: () => ({ ...child.state }),
      });
      Object.defineProperty(this.#actions, name, {
        enumerable: true,
        configurable: true,
        get: () => ({ ...child.actions }),
      });
      Object.keys(this.#listeners).forEach(type => {
        child.listen(type, (newState, oldState, path, actionName) => {
          this.#announce(type, newState, oldState, [name, ...path]);
        });
      });
    });
    return this;
  }

  /**
   * Use a selector
   * @param {Function(Object):*} selector
   * A selector is a function that picks values out of the state.
   **/
  useSelector(selector) {
    const [value, setValue] = useState(selector(this.state));
    useEffect(() => {
      return this.listen((newState, oldState) => {
        const gnu = selector(newState);
        const old = selector(oldState);
        if (gnu !== old) {
          setValue(gnu);
        }
      });
    }, []);
    return value;
  }

  /**
   * Listen for updates to the state machine
   * @param {String} [type='all'] The type of update to listen to ('init', 'step', 'complete')
   * @param {Function(newState, oldState, path, actionName)} listener The function to call when an update happens
   * @returns {Function} a function to call to remove the listener
   **/
  listen(type, listener) {
    if (typeof type === 'function') {
      const unlisteners = Object.keys(this.#listeners).map(t => this.listen(t, type));
      return () => unlisteners.forEach(u => u());
    }
    if (type === 'all') return this.listen(listener);
    this.#listeners[type].add(listener);
    return () => this.#listeners[type].remove(listener);
  }

  /**
   * Connector HOC, for class components
   * There's no need for a mapActionsToProps, since actions are contextless.
   * Documenting this is a lot of trouble; it works identically to Redux's connect(), but without the second argument.
   **/
  connect(mapStateToProps) {
    return Component => (ownProps) => {
      const stateProps = this.useSelector((state) => mapStateToProps(state, ownProps));
      return createElement(Component, { ...ownProps, ...stateProps });
    };
  }
}

export default StateMachine;
