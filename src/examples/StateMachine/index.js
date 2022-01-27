import StateMachine from 'StateMachine';
import { useEffect } from 'preact/hooks';
import html from 'html';
import useSelector from 'StateMachine/useSelector';

const myMachine = StateMachine({
  loadState: 'new',
});
const PERIOD = 3000;
// Create some artificial delays, so you can watch the state transitions happen.
const delay = async t => new Promise(r => setTimeout(r, t));

// This is all mockery, so just fetch the once.
const resourcePromise = fetch('/examples/StateMachine/sample.json').then(r => r.json());

// A complex action with intermediate work 
export const doTheThing = myMachine.action({
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

// The simplest form of action
export const reset = myMachine.action({
  async *reset() {
    yield { loadState: 'new', data: undefined };
  }
});

// You'll typically want to build up a library of selectors, rather than defining them in your templates.

const selLoadState = ({ loadState }) => loadState;
const selGuid = ({ data: { guid } = {} }) => guid;
const selError = ({ error }) => error;

export default (props) => {
  // The selector could be more complex, but for now, just dump the state and destruct
  const loadState = useSelector(myMachine, selLoadState);
  const guid = useSelector(myMachine, selGuid);
  const error = useSelector(myMachine, selError);

  useEffect(() => {
    if (loadState === 'new') {
      // Initial fetch for the machine - but only if it's not fetched before.
      doTheThing();
    } else if (loadState === 'error') {
      // Wait 3s, then reset (this causes the whole thing to loop)
      delay(PERIOD).then(() => {
        reset();
      });
    }
  }, [loadState]);

  // Normal template stuff
  if (loadState === 'new' || loadState === 'loading') {
    return html`<div className="loading">Loading (${loadState})...</div>`;
  }
  if (loadState === 'error') {
    return html`${loadState}<br /><div className="error">${error.message}</div>`;
  }
  return html`${loadState}<br />${guid}`;
}