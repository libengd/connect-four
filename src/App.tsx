import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

import {
  Box,
  Grommet,
  Text,
  Anchor,
} from "grommet";

import { AppHeader } from './components/AppHeader/AppHeader';
import { Menu, Gremlin as GremlinIcon, LinkPrevious } from "grommet-icons";
import { Routes, Route, useParams, useNavigate, Navigate, useLocation } from "react-router-dom";
import { theme } from "./theme"
import useAppState from './hooks/useApp';
import useUser from './hooks/useUser';
import hoprLogo from './hopr_icon.svg';
import ConnectFour from './components/ConnectFour/ConnectFour';
import useWebsocket from './hooks/useWebsocket';
import Settings from './components/Settings/Settings';
import styled from 'styled-components';


const BottomShadowBox = styled(Box)`
box-shadow: 0 3px 2px -2px gray;
`

const GoBack = styled(LinkPrevious)`
cursor: pointer;
`

function SettingsBody({ myPeerId, updateSettings, settings, ...props }: any) {
  const navigate = useNavigate();

  return <Box fill background="light-3">
    <Box flex overflow="auto" gap="medium" pad="medium">
      <Box flex={false} direction="row-responsive" wrap>
        <Box gap="large" flex="grow" margin="medium">
        </Box>
        <Box gap="large" flex="grow" margin="medium">
          <Box pad="medium" direction="column" background="white">
            <Box direction="row">
              <GoBack onClick={() => navigate(-1)} />
              <Box margin={{ left: "small" }}>
                <Text>Settings</Text>
              </Box>
            </Box>
            <Settings myPeerId={myPeerId} settings={settings} updateSettings={updateSettings} />
          </Box>

          {/* {utilization.map(data => (
      <UtilizationCard key={data.name} data={data} />
    ))} */}
          <Box flex="grow" margin="medium" align="center">
            <Text>made with <Anchor target="_blank" href="https://v2.grommet.io/"><GremlinIcon color="brand" /> Grommet</Anchor> and <Anchor target="_blank" href="https://hoprnet.org/"><img width="24" src={hoprLogo} /> Hopr</Anchor></Text>
          </Box>
        </Box>
        <Box flex="grow" margin="medium">
        </Box>
      </Box>
    </Box>
  </Box>
}

function AppBody({ myPeerId, native, sendMessage, handleReceivedMessage, socketRef }: any) {
  return (
    <Box fill>
      <Box flex overflow="auto" gap="medium" pad="medium">
        <Box flex={false} direction="row-responsive" wrap>
          <Box gap="large" flex="grow" margin="medium">
          </Box>
          <Box gap="large" flex="grow" margin="medium">
            <AppHeader
              appName={myPeerId || ""}
              appIcon={<Menu />}
              nativeAddress={native || ""}
            />
            <Box pad="medium" direction="column" background="white">
              <Box margin="auto">
                <ConnectFour socketRef={socketRef} myPeerId={myPeerId} sendMessage={sendMessage} handleReceivedMessage={handleReceivedMessage} />
              </Box>
            </Box>

            {/* {utilization.map(data => (
            <UtilizationCard key={data.name} data={data} />
          ))} */}
            <Box flex="grow" margin="medium" align="center">
              <Text>made with <Anchor target="_blank" href="https://v2.grommet.io/"><GremlinIcon color="brand" /> Grommet</Anchor> and <Anchor target="_blank" href="https://hoprnet.org/"><img width="24" src={hoprLogo} /> Hopr</Anchor></Text>
            </Box>
          </Box>
          <Box flex="grow" margin="medium">
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

function App() {
  const {
    state: { settings, conversations, selection },
    updateSettings,
    setSelection,
    addSentMessage,
    addReceivedMessage,
    handleAddNewConversation,
    handleSendMessage,
    handleReceivedMessage
  } = useAppState()
  
  const { search } = useLocation();

  const websocket = useWebsocket(settings)
  const { socketRef } = websocket
  const user = useUser(settings)
  const { myPeerId, native } = user?.state;
  const { getReqHeaders } = user

  return (
    <Grommet theme={theme} full>
      <Routes>
        <Route path="/" element={<Navigate to={`/app${search}`} replace />}>
        </Route>
        <Route path="app/*" element={<AppBody
          myPeerId={myPeerId}
          native={native}
          sendMessage={handleSendMessage(addSentMessage)(
            myPeerId,
            socketRef,
            getReqHeaders(true)
          )}
          socketRef={socketRef}
          handleReceivedMessage={handleReceivedMessage}
        />} />
        <Route path="settings" element={<SettingsBody myPeerId={myPeerId} settings={settings} updateSettings={updateSettings} />} />
      </Routes>
    </Grommet>
  );
}

export default App;
