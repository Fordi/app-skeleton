const joinClass = (...classes) => Array.from(new Set(classes.filter(a => !!a).join(' ').split(' ').reverse())).reverse().join(' ');

const classes = (...names) => Object.assign(
  (...more) => classes(...names, ...more),
  {
    toString: () => joinClass(...names),
    and: (...more) => classes(...names, ...more),
  }
);

export default classes;