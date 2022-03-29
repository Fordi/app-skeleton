import html from 'html';
import { Back } from 'PathRouter';

export default ({ id }) => html`
  <h3>Pattern test (index)</h3>
  <p>
    ID: ${id}
  </p>
  <${Back}>Back</>
`;
