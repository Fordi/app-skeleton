import 'react:cjs';
import 'react-dom:cjs';
const { React, ReactDOM } = globalThis;
delete globalThis.React;
delete globalThis.ReactDOM;
export default React;
export { ReactDOM };
