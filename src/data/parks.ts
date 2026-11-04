import rawParks from './parks.json';
import { normalizeParks } from './normalize';

export const parks = normalizeParks(rawParks);
