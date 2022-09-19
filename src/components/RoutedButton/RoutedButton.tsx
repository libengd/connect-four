import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "grommet"

export const RoutedButton = ({ path, ...props }: any) => {
  const navigate = useNavigate()
  const { search } = useLocation();

  const onClick = (event: any) => {
    event.preventDefault();
    navigate(path + search)
  };
  return <Button onClick={onClick} {...props}></Button>
}