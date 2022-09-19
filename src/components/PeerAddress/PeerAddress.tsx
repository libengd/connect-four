import { Text, Tip } from "grommet"
import { useState } from "react"
import styled from "styled-components"

const PointerText = styled(Text)`
&:hover {
  cursor: pointer;
}
`

export const PeerAddress = ({ expandable = false, address, ...props }: any) => {
  const [expand, setExpand] = useState(false)
  return <PointerText onClick={() => setExpand(true)} {...props}>
    {(expandable && expand) ? address : address.slice(-5)}
  </PointerText>
}
