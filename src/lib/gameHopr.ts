import { Board } from './connectFour/board'
import { BoardBase, BoardPiece } from './connectFour/base'
import {
  GameBase,
  MESSAGE_TYPE,
  constructMessage,
  parseMessage,
  GameOnlineMessage,
} from './gameBase'
import { Player, PlayerHuman, PlayerShadow } from './connectFour/player'
import { showMessage, getColumnFromCoord } from './connectFour/canvasUtils'

export enum GAME_MODE {
  FIRST = BoardPiece.PLAYER_1,
  SECOND = BoardPiece.PLAYER_2,
}

const statusbox = document.querySelector('.statusbox')
const statusboxBodyGame = document.querySelector('.statusbox-body-game')
const statusboxBodyConnection = document.querySelector(
  '.statusbox-body-connection'
)
export class GameHopr extends GameBase {
  connectionPlayerId: null | string = null
  connectionMatchId: null | string = null
  gameMode: GAME_MODE

  playerMain: PlayerHuman
  playerShadow: PlayerShadow
  statusBoxRef: any
  winnerBoxRef: any
  setWinner: any

  constructor(
    players: Array<Player>,
    board: BoardBase,
    statusBoxRef: any,
    setWinner: any,
    { gameMode }: { gameMode: GAME_MODE }
  ) {
    super(players, board)
    this.gameMode = gameMode
    this.statusBoxRef = statusBoxRef
    this.setWinner = setWinner
    if (gameMode === GAME_MODE.FIRST) {
      this.playerMain = players[0] as PlayerHuman
      this.playerShadow = players[1] as PlayerShadow
    } else {
      this.playerMain = players[1] as PlayerHuman
      this.playerShadow = players[0] as PlayerShadow
    }
  }

  /**
   * @returns true if the game is waiting for current player to make a move
   */
  isCurrentMoveByCurrentPlayer() {
    return this.currentPlayerId + 1 === this.gameMode
  }

  beforeMoveApplied = () => {
    if (statusboxBodyGame) {
      statusboxBodyGame.textContent = `Dropping ${
        this.currentPlayerId === 0 ? '🔴' : '🔵'
      } disc`
    }
  }

  waitingForMove = () => {
    // if (this.statusBoxRef) {
    //   this.statusBoxRef.current.textContent = 'Wating for move'
    // }

    if (this.statusBoxRef) {
      this.statusBoxRef.current.textContent =
        (this.isCurrentMoveByCurrentPlayer() ? `Your move` : `Waiting for opponent`)
    }
  }

  afterMove = (action: number) => {
  }

  announceWinner(winnerBoardPiece: BoardPiece) {
    super.announceWinner(winnerBoardPiece)
    this.setWinner(winnerBoardPiece)
    // Do nothing here, will wait for server to announce
  }
}
