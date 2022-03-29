import { setReactor } from './reactor-core.js';
import React from 'react';
import ReactDOM from 'react-dom';
setReactor({
  ...React,
  render: ReactDOM.render
});