export default ({ useState }) => function useSelector(machine, selector) {
  const [value, setValue] = useState(selector(machine.getState()));
  useEffect(
    () => machine.listen((newState, oldState) => {
      const gnu = selector(newState);
      const old = selector(oldState);
      if (gnu !== old) {
        setValue(gnu);
      }
    }), 
    [updateState],
  );
  return value;
};
