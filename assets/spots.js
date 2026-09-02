/* superbot.gg / ads — the spot registry.
   Every ad in the series registers here; the player page, gallery and
   render/audit tools pick spots by name. Adding a spot = one file + one row. */

import { cheaperSpot } from './ad.js'
import { fasterSpot } from './spots/faster.js'
import { benchmarkSpot } from './spots/benchmark.js'
import { comparedSpot } from './spots/compared.js'
import { mergedSpot } from './spots/merged.js'
import { handsoffSpot } from './spots/handsoff.js'
import { boardSpot } from './spots/board.js'
import { toolingSpot } from './spots/tooling.js'
import { installSpot } from './spots/install.js'

export const SPOTS = {
  cheaper: cheaperSpot,
  faster: fasterSpot,
  benchmark: benchmarkSpot,
  compared: comparedSpot,
  merged: mergedSpot,
  handsoff: handsoffSpot,
  board: boardSpot,
  tooling: toolingSpot,
  install: installSpot,
}
