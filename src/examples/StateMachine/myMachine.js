import StateMachine from 'StateMachine';
import delay from './delay.js';

export const PERIOD = 3000;

// This is all mockery, so just fetch the once.
const resourcePromise = fetch('/examples/StateMachine/sample.json').then(r => r.json());

const { action, select } = StateMachine({
  loadState: 'new',
});

// The simplest form of action
export const reset = action({
  async *reset() {
    yield { loadState: 'new', data: undefined };
  }
});

// Actions should be named like verbs
export const doTheThing = action({
  async *doTheThing() {
    await delay(PERIOD);
    yield { loadState: 'loading', error: undefined };
    try {
      await delay(PERIOD);
      // Yield a new result to update the state
      yield {
        loadState: 'ready',
        data: await resourcePromise,
      };
      await delay(PERIOD);
      throw new Error("Intentionally broken");
    } catch (error) {
      yield {
        loadState: 'error',
        data: undefined,
        error
      };
    };
  },
});

// You'll typically want to build up a library of selectors, rather than defining them in your templates.
// Selectors should be named like hooks; e.g., `useDataPoint`

export const useLoadState = select(({ loadState }) => loadState);
export const useGuid = select(({ data: { guid } = {} }) => guid);
export const useError = select(({ error }) => error);
