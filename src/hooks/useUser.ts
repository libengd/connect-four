/*
  A react hook.
  Keeps user state updated whenever endpoint is changed.
*/
import type { Settings } from "../types";
import { useEffect } from "react";
import { useImmer } from "use-immer";
import { isSSR } from "../utils";
import { accountAddress, accountGetBalances, channelsCloseChannel, channelsGetChannels, channelsOpenChannel } from "../lib/api";

export type UserState = {
  myPeerId?: string;
  native?: string;
  channels: {
    incoming?: any,
    outgoing?: any
  };
  balances: {
    eth?: string,
    hopr?: string
  },
  error?: string;
}

const useUser = (settings: Settings) => {
  const [state, setState] = useImmer<UserState>({ balances: {}, channels: {} });

  // construct headers to be used in authenticated requests
  // when security token is present
  const getReqHeaders = (isPost: boolean = false) => {
    const headers = new Headers();
    if (isPost) {
      headers.set("Content-Type", "application/json");
      headers.set("Accept-Content", "application/json");
    }
    if (settings.apiToken) {
      headers.set("Authorization", "Basic " + btoa(settings.apiToken));
      headers.set("x-auth-token", settings.apiToken);
    }

    return headers;
  };

  const closeChannel = async (peerId: string, direction: string) => {
    const headers = getReqHeaders()
    await channelsCloseChannel(settings.apiEndpoint, headers)(peerId, direction);
  }

  const openChannel = async (peerId: string, amount: string) => {
    const headers = getReqHeaders(true)
    await channelsOpenChannel(settings.apiEndpoint, headers)(peerId, amount);
  }

  // runs everytime "apiEndpoint" changes
  useEffect(() => {
    if (isSSR) return;
    console.info("Fetching user data..");
    const getAsync = async () => {
      const headers = getReqHeaders()
      const { hoprAddress, native } = await accountAddress(settings.apiEndpoint, headers)();

      const { hopr, native: eth } = await accountGetBalances(settings.apiEndpoint, headers)();

      const { incoming, outgoing } = await channelsGetChannels(settings.apiEndpoint, headers)();

      setState((draft) => {
        draft.myPeerId = hoprAddress
        draft.native = native
        draft.balances.eth = eth
        draft.balances.hopr = hopr
        draft.channels.incoming = incoming
        draft.channels.outgoing = outgoing
        return draft
      })
    }
    getAsync()
  }, [settings?.apiEndpoint, settings?.apiToken]);

  return {
    state,
    closeChannel,
    openChannel,
    getReqHeaders,
  };
};

export default useUser;
