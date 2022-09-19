import { Board } from './connectFour/board'
import { BoardBase, BoardPiece } from './connectFour/base'
import { Player } from './connectFour/player'

export enum MESSAGE_TYPE {
  NEW_PLAYER_CONNECTION_REQUEST = 'NEW_PLAYER_CONNECTION_REQUEST',
  NEW_PLAYER_CONNECTION_OK = 'NEW_PLAYER_CONNECTION_OK',

  NEW_MATCH_REQUEST = 'NEW_MATCH_REQUEST',
  NEW_MATCH_OK = 'NEW_MATCH_OK',

  GAME_READY = 'GAME_READY',
  GAME_ENDED = 'GAME_ENDED',
  GAME_RESET = 'GAME_RESET',

  CONNECT_MATCH_REQUEST = 'CONNECT_MATCH_REQUEST',
  CONNECT_MATCH_OK = 'CONNECT_MATCH_OK',
  CONNECT_MATCH_FAIL = 'CONNECT_MATCH_FAIL',

  HUNG_UP = 'HUNG_UP',
  OTHER_PLAYER_HUNGUP = 'OTHER_PLAYER_HUNGUP',

  MOVE_MAIN = 'MOVE_MAIN',
  MOVE_SHADOW = 'MOVE_SHADOW',
}

export type PlayerId = string

export type MatchId = string

export type GameOnlineMessage =
  | { type: 'NEW_PLAYER_CONNECTION_REQUEST'; payload: {} }
  | {
      type: 'NEW_PLAYER_CONNECTION_OK'
      payload: { playerId: PlayerId }
    }
  | { type: 'NEW_MATCH_REQUEST'; payload: { playerId: PlayerId } }
  | { type: 'NEW_MATCH_OK'; payload: { matchId: MatchId } }
  | { type: 'GAME_READY'; payload: { matchId: MatchId } }
  | {
      type: 'GAME_ENDED'
      payload: {
        winnerBoardPiece: BoardPiece
        matchId: MatchId
        gameWinnerPlayerId: PlayerId
      }
    }
  | { type: 'GAME_RESET'; payload: { matchId: MatchId } }
  | {
      type: 'CONNECT_MATCH_REQUEST'
      payload: { playerId: PlayerId; matchId: MatchId }
    }
  | {
      type: 'CONNECT_MATCH_OK'
      payload: { matchId: MatchId; playerId: PlayerId }
    }
  | {
      type: 'CONNECT_MATCH_FAIL'
      payload: { matchId: MatchId; playerId: PlayerId }
    }
  | { type: 'HUNG_UP'; payload: {} }
  | { type: 'OTHER_PLAYER_HUNGUP'; payload: {} }
  | { type: 'MOVE_MAIN'; payload: { column: number } }
  | { type: 'MOVE_SHADOW'; payload: { column: number } }

export function constructMessage(
  type: MESSAGE_TYPE,
  payload?: GameOnlineMessage['payload']
): string {
  console.log('[ws] send: ', type, payload)
  return JSON.stringify({
    type,
    payload: payload || {},
  })
}
export function parseMessage(message: string): GameOnlineMessage {
  const parsedMessage = JSON.parse(message)
  console.log('[ws] receive: ', parsedMessage)
  return parsedMessage
}

export abstract class GameBase<P extends Player = Player> {
  board: BoardBase
  players: Array<P>
  currentPlayerId: number
  isMoveAllowed: boolean = false
  isGameWon: boolean = false

  constructor(players: Array<P>, board: BoardBase) {
    this.board = board
    this.players = players
    this.currentPlayerId = 0
    this.reset()
  }
  reset() {
    this.isMoveAllowed = false
    this.isGameWon = false
    this.board.reset()
    // this.board.debug()
  }

  async start() {
    this.isMoveAllowed = true
    while (!this.isGameWon) {
      await this.move()
      const winner = this.board.getWinner()
      if (winner !== BoardPiece.EMPTY) {
        console.log('[GameBase] Game over: winner is player ', winner)
        this.isGameWon = true
        this.isMoveAllowed = false
        this.announceWinner(winner)
        break
      }
    }
  }
  async move() {
    if (!this.isMoveAllowed) {
      return
    }
    const currentPlayer = this.players[this.currentPlayerId]
    let actionSuccesful = false
    while (!actionSuccesful) {
      this.waitingForMove()
      const action = await currentPlayer.getAction(this.board)
      this.isMoveAllowed = false
      this.beforeMoveApplied(action)
      actionSuccesful = await this.board.applyPlayerAction(
        currentPlayer,
        action
      )
      this.isMoveAllowed = true
      if (!actionSuccesful) {
        console.log('Move not allowed! Try again.')
      } else {
        this.afterMove(action)
      }
    }
    this.currentPlayerId = this.getNextPlayer()
  }
  abstract waitingForMove(): void
  abstract beforeMoveApplied(action: number): void
  abstract afterMove(action: number): void

  announceWinner(winnerPiece: BoardPiece) {
    const winner = {
      [BoardPiece.DRAW]: 'draw',
      [BoardPiece.PLAYER_1]: 'Player 1',
      [BoardPiece.PLAYER_2]: 'Player 2',
      [BoardPiece.EMPTY]: 'none',
    }[winnerPiece]
    console.log('[GameBase] Game over: winner is ', winner, winnerPiece)
  }

  private getNextPlayer() {
    return this.currentPlayerId === 0 ? 1 : 0
  }
}
