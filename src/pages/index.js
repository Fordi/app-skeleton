import html from 'html';
import { Link } from 'PathRouter';

export default () => html`
  <h3>Examples</h3>
  <ul>
    <li><${Link} to="./StateMachine/">StateMachine</></li>
  </ul>
`;
