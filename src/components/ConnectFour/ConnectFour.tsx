import { FunctionComponent, useEffect, useRef, useState } from "react";
import { Box, Button, TextInput, Text, Tip } from "grommet";
import { StatusWarning, StatusGood, StatusInfo, StatusCritical } from "grommet-icons";
import { Board } from "../../lib/connectFour/board";
import { GameHopr, GAME_MODE } from "../../lib/gameHopr";
import { VerifiedStatus } from "../../hooks/useApp"
import seedrandom from "seedrandom"
import { getColumnFromCoord } from "../../lib/connectFour/canvasUtils";
import { PlayerHuman, PlayerShadow } from "../../lib/connectFour/player";
import { BoardPiece } from "../../lib/connectFour/base";
import { useImmer } from "use-immer";

enum GAME_STATUS {
  IDLE,
  CONNECTING,
  PLAY
}

enum Action {
  CONNECT,
  PROOF,
  CONNECT_IN,
  PROOF_IN,
  MOVE_IN
}

const ConnectFour: FunctionComponent<{ socketRef: any, myPeerId: string, handleReceivedMessage: any, sendMessage: any }> = ({
  myPeerId,
  handleReceivedMessage,
  sendMessage,
  socketRef,
}) => {
  const [seed, setSeed] = useState("")
  const [proof, setProof] = useState(0)
  const [myProof, setMyProof] = useState(0)
  const [status, setStatus] = useState(GAME_STATUS.IDLE)
  const [peerId, setPeerId] = useState("")

  const [board, setBoard] = useState<Board>();
  const [game, setGame] = useState<GameHopr>();
  const [history, updateHistory] = useImmer<any[]>([])
  const statusBoxRef = useRef<any>()
  const [winner, setWinner] = useState<number | null>(null)

  const resetHistory = () => {
    updateHistory(draft => {
      draft = []
    })
  }
  const pushHistory = (entry: any) => {
    updateHistory(draft => {
      draft.push(entry)
    })
  }

  const ref: any = useRef()

  const addReceivedMessage = (
    from: string,
    content: string,
    verifiedStatus?: VerifiedStatus,
    hasHTML = false
  ) => {
    const action = JSON.parse(content);
    switch (action.action) {
      case 'connect': {
        setPeerId(action.from)
        pushHistory(Action.CONNECT_IN)
        break
      }
      case 'proof': {
        setProof(action.proof)
        pushHistory(Action.PROOF_IN)
        break
      }
      case 'move': {
        // pushHistory(Action.MOVE_IN, action.column)
        // game.messageActionHandler()
        break
      }
    }
  }

  const hasEntry = (history: any[], entry: any) => history.indexOf(entry) !== -1

  useEffect(() => {
    const lastEntry = history[history.length - 1]
    if (lastEntry === Action.CONNECT_IN) {
      if (hasEntry(history, Action.CONNECT)) {
        const myProof = Math.round(Math.random() * 1e12);
        setMyProof(myProof)
        sendMessage(peerId, JSON.stringify({ action: "proof", proof: myProof }))
        pushHistory(Action.PROOF)
      } else {
        sendMessage(peerId, JSON.stringify({ action: "connect", from: myPeerId }))
        pushHistory(Action.CONNECT)
      }
    }
    if (lastEntry === Action.PROOF_IN) {
      if (hasEntry(history, Action.PROOF)) {
        const seed = (proof + myProof).toString()
        setSeed(seed)
        setStatus(GAME_STATUS.PLAY)
      } else {
        const myProof = Math.round(Math.random() * 1e12);
        setMyProof(myProof)
        const seed = (proof + myProof).toString()
        setSeed(seed)
        sendMessage(peerId, JSON.stringify({ action: "proof", proof: myProof }))
        pushHistory(Action.PROOF)
        setStatus(GAME_STATUS.PLAY)
      }
    }
  }, [peerId, status, proof, seed, myProof, history])

  useEffect(() => {
    if (!myPeerId || !socketRef.current) return;
    socketRef.current.addEventListener(
      "message",
      handleReceivedMessage(addReceivedMessage)
    );

    return () => {
      if (!socketRef.current) return;
      socketRef.current.removeEventListener(
        "message",
        handleReceivedMessage(addReceivedMessage)
      );
    };
  }, [myPeerId, socketRef.current]);

  useEffect(() => {
    switch (status) {
      case GAME_STATUS.PLAY: {
        if (game) return;
        if (!board) return;

        let gameMode

        const peers = [myPeerId, peerId].sort((a, b) => a.localeCompare(b))


        if (seedrandom(seed)() > 0.5) {
          if (peers[0] == myPeerId) {
            gameMode = GAME_MODE.FIRST
          } else {
            gameMode = GAME_MODE.SECOND
          }
        } else {
          if (peers[0] == myPeerId) {
            gameMode = GAME_MODE.SECOND
          } else {
            gameMode = GAME_MODE.FIRST
          }
        }

        const players =
          gameMode === GAME_MODE.FIRST
            ? [
              new PlayerHuman(BoardPiece.PLAYER_1),
              new PlayerShadow(BoardPiece.PLAYER_2),
            ]
            : [
              new PlayerShadow(BoardPiece.PLAYER_1),
              new PlayerHuman(BoardPiece.PLAYER_2),
            ]

        const gameInstance = new GameHopr(players, board, statusBoxRef, setWinner, {
          gameMode,
        })

        gameInstance.start()

        const canvas = ref.current
        canvas.addEventListener('click', async (event: MouseEvent) => {
          if (!gameInstance.isGameWon) {
            const rect = canvas.getBoundingClientRect()
            const x = event.clientX - rect.left
            const y = event.clientY - rect.top
            const column = getColumnFromCoord({ x: x, y: y })
            gameInstance.playerMain.doAction(column)
            sendMessage(peerId, JSON.stringify({ action: "move", column }))
          }
        })

        const addReceivedMessage = (
          from: string,
          content: string,
          verifiedStatus?: VerifiedStatus,
          hasHTML = false
        ) => {
          const action = JSON.parse(content);
          switch (action.action) {
            case 'move': {
              gameInstance?.playerShadow.doAction(action.column)
              break
            }
          }
        }
      
        socketRef.current.addEventListener(
          "message",
          handleReceivedMessage(addReceivedMessage)
        );
        
        setGame(gameInstance)

        return () => {
          if (!socketRef.current) return;
          socketRef.current.removeEventListener(
            "message",
            handleReceivedMessage(addReceivedMessage)
          );
        };
      }
    }
  }, [status, seed, proof, board, game, peerId, socketRef.current])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) {
      console.error('Canvas DOM is null')
      return
    }

    const boardInstance = new Board(canvas)
    boardInstance.render()
    setBoard(boardInstance)

    if (!canvas) {
      console.error('Canvas DOM is null')
      return
    }
  }, [])

  const gameStatus = [
    "Idle",
    "Connecting",
    "Playing"
  ]

  let winStatus = ''
  if (winner === game?.playerMain.boardPiece) {
    winStatus = 'You win!'
  } else if (winner === BoardPiece.DRAW) {
    winStatus = 'It\'s a Draw'
  } else {
    winStatus = 'Opponent wins'
  }

  return (
    <Box>
      <Box pad="small">
        Game Status: {gameStatus[status]}
      </Box>
      {winner !== null && status === 2 ? <Text>
        {winStatus}
      </Text> : ''}
      <Box pad="small">
        <canvas ref={ref}></canvas>
      </Box>
      <Box>
        <Text ref={statusBoxRef} textAlign="end"></Text>
      </Box>
      <Box pad="small">
        <TextInput onChange={(e) => setPeerId(e.target.value)} value={peerId} placeholder="Opponent" />
      </Box>
      {winner !== null && status === 2 ? <Button primary label="new game" onClick={() => {
        resetHistory()
        setStatus(GAME_STATUS.IDLE)
      }}/> : ''}
      {status == 0 ?<Button primary label="connect" onClick={() => {
        pushHistory(Action.CONNECT)
        setStatus(GAME_STATUS.CONNECTING)
        sendMessage(peerId, JSON.stringify({ action: "connect", from: myPeerId }))
      }}/> : ''}
    </Box>
  );
};

export default ConnectFour;
