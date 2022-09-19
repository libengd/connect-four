import { BoardBase, BoardPiece } from './base'

export abstract class Player {
  boardPiece: BoardPiece
  abstract getAction(board: BoardBase): Promise<number>
  constructor(boardPiece: BoardPiece) {
    this.boardPiece = boardPiece
  }
}

export class PlayerHuman extends Player {
  clickPromiseResolver: null | ((column: number) => void)

  constructor(boardPiece: BoardPiece) {
    super(boardPiece)
    this.clickPromiseResolver = null
  }

  doAction(column: number) {
    if (
      this.clickPromiseResolver &&
      0 <= column &&
      column < BoardBase.COLUMNS
    ) {
      this.clickPromiseResolver(column)
    }
  }

  getAction(board: BoardBase): Promise<number> {
    return new Promise<number>((r) => (this.clickPromiseResolver = r))
  }
}

export class PlayerShadow extends Player {
  actionPromiseResolver: null | ((column: number) => void)

  constructor(boardPiece: BoardPiece) {
    super(boardPiece)
    this.actionPromiseResolver = null
  }

  doAction(column: number) {
    if (
      this.actionPromiseResolver &&
      0 <= column &&
      column < BoardBase.COLUMNS
    ) {
      this.actionPromiseResolver(column)
    }
  }

  getAction(board: BoardBase): Promise<number> {
    return new Promise<number>((r) => (this.actionPromiseResolver = r))
  }
}
