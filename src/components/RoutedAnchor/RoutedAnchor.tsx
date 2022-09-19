import { useLocation, useNavigate } from "react-router-dom";
import { Anchor } from "grommet"

export const RoutedAnchor = ({ href, ...props }: any) => {
    const navigate = useNavigate()
    const { search } = useLocation();
    
    const onClick = (event: any) => {
      event.preventDefault();
      navigate(href + search)
    };
    return <Anchor href={href} onClick={onClick} {...props}/>
  }
  