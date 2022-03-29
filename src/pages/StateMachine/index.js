import { useEffect } from 'reactor';
import html from 'html';
import { Back } from 'PathRouter';

import {
  // Actions
  doTheThing,
  reset,
  // Selectors
  useLoadState,
  useGuid,
  useError,
  // Constants
  PERIOD,
  // Machines should be named for the state they represent, e.g., 'bill.js'
} from './myMachine.js';
import delay from './delay.js';

const Example = () => {
  // The selector could be more complex, but for now, just dump the state and destruct
  const loadState = useLoadState();
  const guid = useGuid();
  const error = useError();

  useEffect(() => {
    if (loadState === 'new') {
      // Initial fetch for the machine - but only if it's not fetched before.
      doTheThing();
      return;
    }
  }, [loadState]);
  useEffect(() => {
    if (error) {
      // Wait, then reset (this causes the whole thing to loop)
      delay(PERIOD).then(() => {
        reset();
      });
      return;
    }
  }, [error]);

  // Normal template stuff
  if (error) {
    return html`<div>Error: <br /><div className="error">${error.message}</div></div>`;
  }
  if (loadState === 'new' || loadState === 'loading') {
    return html`<div className="loading">Loading (${loadState})...</div>`;
  }
  return html`<div>${loadState}<br />${guid}</div>`;
};

export default () => html`
  <${Example} />
  <br />
  <${Back}>Back</>
`;