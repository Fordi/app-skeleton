import { useState } from 'react';
import createUseSelector from './useSelector.js';

export const useSelector = createUseSelector({ useState });
