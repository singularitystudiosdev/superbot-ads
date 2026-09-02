/* superbot.gg / ads — the spot registry.
   Every ad in the series registers here; the player page, gallery and
   render/audit tools pick spots by name. Adding a spot = one file + one row. */

import { cheaperSpot } from './ad.js'
import { fasterSpot } from './spots/faster.js'

export const SPOTS = {
  cheaper: cheaperSpot,
  faster: fasterSpot,
}
