/**
 * # `importFont`
 * 
 * ```javascript
 * import importFont from 'importFont';
 * const Fonticle = importFont('../assets/Fonticle/Fonticle.woff', '../assets/Fonticle/Fonticle.svg', '../assets/Fonticle/Fonticle.ttf');
 * ```
 * 
 * Imports a font given a set of font file variants, returning the generated internal name for use with `css`.
 * 
 * ## Example usage:
 * 
 * ```javascript
 * import importFont from 'importFont';
 * import css from 'css';
 * 
 * const Fonticle = importFont('../assets/Fonticle/Fonticle.woff', '../assets/Fonticle/Fonticle.svg', '../assets/Fonticle/Fonticle.ttf');
 * const styles = css`
 *   .heading {
 *     font-face: '${Fonticle}', sans-serif;
 *   }
 * `;
 * ```
 */
const order = ['embedded-opentype', 'woff2', 'woff', 'truetype', 'svg'];
const extMap = { ttf: 'truetype', eot: 'embedded-opentype' };

/**
 * @function importFont
 * Import a font given a set of font files
 * @param {String} paths... List of paths to variations on the font to import.
 *  Supports woff2, woff, ttf, svg, and eot fonts.
 * @returns {String} the internal name for the font, for reference by `css` instances.
 */
export default (...paths) => {
  const fonts = paths.reduce((o, path) => {
    const ext = path.replace(/^.*\.([^\.]+)(?:#.*)?$/, '$1').toLowerCase();
    const obj = { path, type: extMap[ext] || ext };
    if (obj.type === extMap.eot) {
      o.eot = path;
      obj.path = `${path}?#iefix`;
    }
    return { ...o, [obj.type]: obj.path };
  }, {});

  // Generate the font slug
  const fontName = 'font_' + Math.random().toString(36).substr(2);
  css`
    @font-face {
      font-family: '${fontName}';
      ${fonts.eot ? `src: url('${fonts.eot}');` : ''}
      src: ${order.map((type) => fonts[type] && `url('${fonts[type]}') format('${type}')`).filter(a => a).join(', ')};
      font-weight: normal;
      font-style: normal;
    }
  `;
  return fontName;
};
