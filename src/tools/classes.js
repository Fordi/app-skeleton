const joinClass = (...classes) => Array.from(new Set(classes.filter(a => !!a).join(' ').split(' ').reverse())).reverse().join(' ');
/**
 * # `classes`
 * 
 * ```javascript
 * import classes from 'classes';
 * <div className=${classes('className', condition && 'anotherClass', 'andSoOn')} />
 * ```
 * 
 * `classes` returns a function whose `toString()` method has been overloaded to
 * return a valid, deduplicated className string.  Calling the function directly will 
 * return another function, decorated the same way, with the arguments passed
 * appended to the list. Any falsy values in the list are ignored, which makes
 * `classes` a good way to build out a list of conditional classes.
 * 
 * `.and(...)` is equivalent to directly calling the function, and is nicer,
 * semantically, e.g., `classes('className').and(condition && 'anotherClass').
 * 
 * `classes` is used by the CSS-in-JS template function, [`css`](./css.md) for 
 * its slugs, so if you're using `css`, you probably won't need `classes` directly.
 */
const classes = (...names) => Object.assign(
  (...more) => classes(...names, ...more),
  {
    toString: () => joinClass(...names),
    and: (...more) => classes(...names, ...more),
  }
);

export default classes;