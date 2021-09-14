import { useState } from "preact/hooks";
import createUseSelector from './useSelector.js';

export const useSelector = createUseSelector({ useState });
