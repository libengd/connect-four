import { FunctionComponent, useEffect, useRef, useState } from "react";
import { Box, Button, TextInput, Text, Tip, RangeInput, CheckBox } from "grommet";
import { StatusWarning, StatusGood, StatusInfo, StatusCritical, CircleQuestion } from "grommet-icons";
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

  const [rowsValue, setRowsValue] = useState<number>(6)
  const [colsValue, setColsValue] = useState<number>(7)
  const [isCylinder, setIsCylinder] = useState<boolean>(false)

  const resetHistory = () => {
    updateHistory(draft => {
      return []
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
        setColsValue(Math.min(10, Math.max(4, Math.floor(action.settings?.cols))))
        setRowsValue(Math.min(10, Math.max(4, Math.floor(action.settings?.rows))))
        setIsCylinder(!!action.settings?.isCylinder)
        break
      }
      case 'connect_and_proof':
        setPeerId(action.from)
        setProof(action.proof)
        pushHistory(Action.CONNECT_IN)
        pushHistory(Action.PROOF_IN)
        break
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
      const myProof = Math.round(Math.random() * 1e12);
      setMyProof(myProof)
      sendMessage(peerId, JSON.stringify({ action: "connect_and_proof", from: myPeerId, proof: myProof }))
      pushHistory(Action.CONNECT)
      pushHistory(Action.PROOF)
      // if (hasEntry(history, Action.CONNECT)) {
      // } else {
      //   sendMessage(peerId, JSON.stringify({ action: "connect", from: myPeerId }))
      // }
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
    board?.setDims(rowsValue, colsValue)
    board?.initConstants()
    board?.render()
  }, [board, rowsValue, colsValue])

  useEffect(() => {
    switch (status) {
      case GAME_STATUS.PLAY: {
        if (game) return;
        if (!board) return;

        let gameMode

        const peers = [myPeerId, peerId].sort((a, b) => a.localeCompare(b))


        if (seedrandom(seed)() > 0.5) {
          if (peers[0] === myPeerId) {
            gameMode = GAME_MODE.FIRST
          } else {
            gameMode = GAME_MODE.SECOND
          }
        } else {
          if (peers[0] === myPeerId) {
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
        }, isCylinder)

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
        <Text>Rows: {rowsValue}</Text>
        <RangeInput disabled={status !== GAME_STATUS.IDLE} onChange={event => setRowsValue(+event.target.value)} value={rowsValue} min="4" max="10" step={1} name="rows" />
        <Text>Columns: {colsValue}</Text>
        <RangeInput disabled={status !== GAME_STATUS.IDLE} onChange={event => setColsValue(+event.target.value)} value={colsValue} min="4" max="10" step={1} name="colums" />
        <CheckBox
          disabled={status !== GAME_STATUS.IDLE}
          checked={isCylinder}
          label={
            <Text>Enable Cylinder Rule
              &nbsp;
              <Tip content="Connections can be made across the far left and far right columns">
                <CircleQuestion />
              </Tip>
            </Text>
          }
          onChange={(event) => setIsCylinder(event.target.checked)}
        />
      </Box>
      <Box pad="small">
        <canvas ref={ref}></canvas>
      </Box>
      {status !== GAME_STATUS.IDLE && <Box>
        <Text ref={statusBoxRef} textAlign="end"></Text>
      </Box>}
      <Box pad="small">
        <TextInput onChange={(e) => setPeerId(e.target.value)} value={peerId} placeholder="Opponent" />
      </Box>
      {winner !== null && status === 2 ? <Button primary label="new game" onClick={() => {
        setStatus(GAME_STATUS.IDLE)
        game?.reset()
        setGame(undefined)
        setWinner(null)
        setProof(0)
        setMyProof(0)
        setSeed("")
        resetHistory()
      }} /> : ''}
      {status === 0 ? <Button primary label="connect" onClick={() => {
        pushHistory(Action.CONNECT)
        setStatus(GAME_STATUS.CONNECTING)
        sendMessage(peerId, JSON.stringify({ action: "connect", from: myPeerId, settings: { rows: rowsValue, cols: colsValue, isCylinder } }))
      }} /> : ''}
    </Box>
  );
};

export default ConnectFour;
