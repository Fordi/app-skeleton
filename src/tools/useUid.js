/**
 * # `useUid`
 *
 * ```javascript
 * const uniqueId = useUid([prefix]);
 * ```
 *
 * Returns a prefixable unique ID that remains the same through the
 * lifetime of the component.
 *
 * ## Example usage:
 *
 * ```javascript
 * const InputField = ({ label, ...props }) => {
 *   const { name = 'input' } = props;
 *   const id = useUid(`${name}_`);
 *
 *   return html`
 *     <span className="input-group">
 *       <label htmlFor=${id}>${label}</label>
 *       <input id=${id} ...${props} />
 *     </span>
 *   `;
 * };
 * ```
 */
import { useState } from 'preact/hooks';

export default (prefix = '') => {
  const [uid] = useState(() => `${prefix}_${Math.random().toString(36).substr(2)}`);
  return uid;
};