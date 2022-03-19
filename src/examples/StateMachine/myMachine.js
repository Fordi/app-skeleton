import StateMachine from 'StateMachine';
import delay from './delay.js';

export const PERIOD = 3000;

const myMachine = StateMachine({
  loadState: 'new',
});

// Enable transition logging
myMachine.log(true);

// Member functions are context-fixed; this is fine.
// `useError` is automatically created to select the `error` field.
const { action, select, useError } = myMachine;

// The simplest form of action
export const reset = action({
  async *reset() {
    yield { loadState: 'new', data: undefined, error: undefined };
  }
});

// Actions should be named like verbs
export const doTheThing = action({
  async *doTheThing() {
    await delay(PERIOD);
    yield { loadState: 'loading', error: undefined };
    await delay(PERIOD);
    // Yield a new result to update the state
    yield {
      loadState: 'ready',
      data: await fetch('/examples/StateMachine/sample.json').then(r => r.json()),
    };
    await delay(PERIOD);
    // Automatic error handling; thrown errors become the field `error` on the state
    throw new Error("Intentionally broken");
  },
});

// You'll typically want to build up a library of selectors, rather than defining them in your templates.
// Selectors should be named like hooks; e.g., `useDataPoint`
export const useLoadState = select(({ loadState }) => loadState);
export const useGuid = select(({ data: { guid } = {} }) => guid);
// Remember to export `useError` so consumers have access to it.
export { useError };

// You probably _don't_ want to do this in production code:
export const useMachineState = select(state => state);
// The reason is that you want to be able to have a consistent way to reference parts of your state
//  if you're pulling in the whole state, it's likely you're deconstructing ad hoc it in your components,
//  which means if you need to do the same thing elsewhere, you're likely to copy that code, instead 
//  of using a selector.
//
// That said, it's a good thing to have for debugging.