import Login from "./pages/Login/login";
import Create from "./pages/Create/create";
import Dashboard from "./pages/Dashboard/dashboard";
import {BrowserRouter as Router , Routes , Route} from 'react-router-dom'


function App() {
  const routes = (
    <Router>
      <Routes>
        <Route path="/" element = {<Login />} />
        <Route path="/create" element = {<Create />} />
        <Route path="/dashboard" element = {<Dashboard />} />
      </Routes>
    </Router>
  ) 

  return (
    <div className="">
      {routes}
    </div>
  );
}

export default App;
