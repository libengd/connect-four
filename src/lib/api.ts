import { UpdateMessageHandlerInterface } from "../hooks/useApp";

export const signRequest = (endpoint: string, headers: Headers) =>
  async (encodedSignMessageRequest: string) => {
    return fetch(`${endpoint}/api/v2/message/sign`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: encodedSignMessageRequest,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.info("Returned response", data.signature)
        return data.signature;
      })
      .catch((err) => {
        console.error("ERROR requesting signature message", err);
        return String(err);
      });
  };

export const sendMessage = (endpoint: string, headers: Headers) =>
  async (recipient: string, body: string, destination: string, id: string, updateMessage: UpdateMessageHandlerInterface) => {
    return fetch(`${endpoint}/api/v2/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        recipient,
        body,
      }),
    })
      .then(async (res) => {
        if (res.status === 204) return updateMessage(destination, id, "SUCCESS");
        if (res.status === 422) return updateMessage(destination, id, "FAILURE", (await res.json()).error)
        // If we didn't get a supported status response code, we return unknown
        const err = 'Unknown response status.'
        console.error("ERROR sending message", err);
        return updateMessage(destination, id, "UNKNOWN", err)
      })
      .catch((err) => {
        console.error("ERROR sending message", err);
        updateMessage(destination, id, "FAILURE", String(err));
      });
  };

export const accountAddress = (endpoint: string, headers: Headers) =>
  async () => {
    const res = await fetch(`${endpoint}/api/v2/account/addresses`, {
      headers,
    })

    return res.json()
  };

export const accountGetBalances = (endpoint: string, headers: Headers) =>
  async () => {
    const res = await fetch(`${endpoint}/api/v2/account/balances`, {
      headers,
    })

    return res.json()
  };

export const aliasesGetAliases = (endpoint: string, headers: Headers) =>
  async () => {
    const res = await fetch(`${endpoint}/api/v2/aliases`, {
      headers,
    })

    return res.json()
  };

export const aliasesGetAlias = (endpoint: string, headers: Headers) =>
  async (alias: string) => {
    const res = await fetch(`${endpoint}/api/v2/aliases/${alias}`, {
      headers,
    })

    return res.json()
  };

export const aliasesSetAlias = (endpoint: string, headers: Headers) =>
  async (peerId: string, alias: string) => {
    const res = await fetch(`${endpoint}/api/v2/aliases`, {
      method: "POST",
      body: JSON.stringify({
        peerId,
        alias
      }),
      headers,
    })

    return res.json()
  };

export const aliasesRemoveAlias = (endpoint: string, headers: Headers) =>
  async (alias: string) => {
    const res = await fetch(`${endpoint}/api/v2/aliases/${alias}`, {
      method: "DELETE",
      headers,
    })

    return res.json()
  };

export const ticketsGetStatistics = (endpoint: string, headers: Headers) =>
  async () => {
    const res = await fetch(`${endpoint}/api/v2/tickets/statistics`, {
      headers,
    })

    return res.json()
  };

export const channelsGetChannels = (endpoint: string, headers: Headers) =>
  async () => {
    const res = await fetch(`${endpoint}/api/v2/channels?includingClosed=true`, {
      headers,
    })

    return res.json()
  };

export const channelsGetChannel = (endpoint: string, headers: Headers) =>
  async (peerId: string, direction: string) => {
    const res = await fetch(`${endpoint}/api/v2/channels/${peerId}/${direction}`, {
      headers,
    })

    return res.json()
  };

export const channelsOpenChannel = (endpoint: string, headers: Headers) =>
  async (peerId: string, amount: string) => {
    const res = await fetch(`${endpoint}/api/v2/channels`, {
      method: "POST",
      body: JSON.stringify({
        peerId,
        amount
      }),
      headers,
    })

    return res.json()
  };

export const channelsCloseChannel = (endpoint: string, headers: Headers) =>
  async (peerId: string, direction: string) => {
    const res = await fetch(`${endpoint}/api/v2/channels/${peerId}/${direction}/`, {
      method: "DELETE",
      headers,
    })

    return res.json()
  };

export const nodeGetPeers = (endpoint: string, headers: Headers) =>
  async () => {
    const res = await fetch(`${endpoint}/api/v2/node/peers`, {
      headers,
    })

    return res.json()
  };

export const nodeGetInfo = (endpoint: string, headers: Headers) =>
  async () => {
    const res = await fetch(`${endpoint}/api/v2/node/info`, {
      headers,
    })

    return res.json()
  };

export const peerInfoGetPeerInfo = (endpoint: string, headers: Headers) =>
  async (peerId: string) => {
    const res = await fetch(`${endpoint}/api/v2/peerInfo/${peerId}`, {
      headers,
    })

    return res.json()
  };

export const settingsGetSettings = (endpoint: string, headers: Headers) =>
  async () => {
    const res = await fetch(`${endpoint}/api/v2/settings`, {
      headers,
    })

    return res.json()
  };

export const settingsSetSetting = (endpoint: string, headers: Headers) =>
  async (setting: string, value: any) => {
    const res = await fetch(`${endpoint}/api/v2/settings/${setting}`, {
      method: "PUT",
      body: JSON.stringify({ settingValue: value }),
      headers,
    })

    return res.json()
  };