import { useState } from 'preact/hooks';

export default (prefix = '') => {
  const [uid] = useState(() => `${prefix}_${Math.random().toString(36).substr(2)}`);
  return uid;
};