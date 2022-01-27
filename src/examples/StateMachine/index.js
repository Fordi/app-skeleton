import { useEffect } from 'preact/hooks';
import html from 'html';

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
} from './myMachine.js';
import delay from './delay.js';

export default (props) => {
  // The selector could be more complex, but for now, just dump the state and destruct
  const loadState = useLoadState();
  const guid = useGuid();
  const error = useError();

  useEffect(() => {
    if (loadState === 'new') {
      // Initial fetch for the machine - but only if it's not fetched before.
      doTheThing();
    } else if (loadState === 'error') {
      // Wait, then reset (this causes the whole thing to loop)
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