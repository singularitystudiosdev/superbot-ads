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
import { receiptSpot } from './spots/receipt.js'
import { racedSpot } from './spots/raced.js'
import { diffSpot } from './spots/diff.js'
import { saidSpot } from './spots/said.js'
import { triedSpot } from './spots/tried.js'
import { didyoumeanSpot } from './spots/didyoumean.js'
import { talkSpot } from './spots/talk.js'
import { pastedSpot } from './spots/pasted.js'
import { nosignupSpot } from './spots/nosignup.js'
import { checksSpot } from './spots/checks.js'
import { pipelineSpot } from './spots/pipeline.js'
import { undoSpot } from './spots/undo.js'

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
  receipt: receiptSpot,
  said: saidSpot,
  raced: racedSpot,
  diff: diffSpot,
  tried: triedSpot,
  didyoumean: didyoumeanSpot,
  talk: talkSpot,
  pasted: pastedSpot,
  nosignup: nosignupSpot,
  checks: checksSpot,
  pipeline: pipelineSpot,
  undo: undoSpot,
}
