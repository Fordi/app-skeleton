import html from 'html';
import { Back } from 'PathRouter';

export default ({ id, name }) => html`
  <h3>Pattern test (details)</h3>
  <p>
    ID: ${id}
    <br />
    ${name && html`
      Name: ${name}
    `}
  </p>
  <${Back}>Back</>
`;
