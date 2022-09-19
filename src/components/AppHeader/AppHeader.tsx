import React from "react";
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon'

import {
  Anchor,
  Box,
  DropButton,
  Menu,
  ResponsiveContext,
  Text,
  Button
} from "grommet";
import { Down } from "grommet-icons";
import { RoutedAnchor } from "../RoutedAnchor/RoutedAnchor";
import { RoutedButton } from "../RoutedButton/RoutedButton";
import { PeerAddress } from "../PeerAddress/PeerAddress";


export const AppHeader = ({ appName, nativeAddress, appIcon, open }: { nativeAddress: string, appName: string, appIcon: React.ReactElement, open?: boolean }) => (
  <Box
    flex={false}
    tag="header"
    direction="row"
    background="white"
    align="center"
    justify="between"
    responsive={false}
  >
    <RoutedAnchor href="/">
      <Text size="medium" margin="small">
        Connect Four
      </Text>
    </RoutedAnchor>
    <DropButton
      open={open}
      onClose={() => { }}
      dropAlign={{ top: "bottom" }}
      dropContent={
        <Box>
          <RoutedButton path="/settings" hoverIndicator="light-4">
            <Box pad="xxsmall">
              <Text size="medium" margin="small">
                Settings
              </Text>
            </Box>
          </RoutedButton>
          {/* <Button hoverIndicator="light-4">
            <Box pad="xxsmall">
              <Text size="medium" margin="small">
                Change Account
              </Text>
            </Box>
          </Button> */}
        </Box>
      }
    >
      <Box
        pad={{ horizontal: "medium", vertical: "small" }}
        responsive={false}
        direction="row"
        align="center"
        gap="small"
      >
        <Jazzicon diameter={32} seed={jsNumberForAddress(nativeAddress)} />
        <PeerAddress address={appName || ""} />
        <Down color="brand" size="small" />
      </Box>
    </DropButton>
  </Box>
);
