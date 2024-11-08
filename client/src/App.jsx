//import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';
import { Container, Row, Alert } from 'react-bootstrap';
import { Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import NavHeader from "./components/NavHeader";
import NotFound from './components/NotFoundComponent';
import { LoginForm } from './components/AuthComponents';
import { WelcomeLayout } from './components/WelcomeComponent';
import API from './API.mjs';
import { DrawLayout } from './components/DrawLayout';
import { BetLayout } from './components/BetLayout';
import { RankingLayout } from './components/RankingLayout';
import dayjs from 'dayjs';

function App() {
  const [draw, setDraw] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false); // NEW
  const [message, setMessage] = useState(''); // NEW
  const [user, setUser] = useState(''); // NEW
  const location = useLocation();

  useEffect(() => {
    // get latest draw froms server
    const getDraw = async () => {
      try{
        const draws = await API.getDraws();
      setDraw(draws);
      } catch(err) {
        console.error('Error fetching the draw:',err);
      
    }
  };
    if (location.pathname === '/draws' || location.pathname === '/draws/bet'){
    getDraw();

    // Set up a polling interval to fetch new draws every 2 minutes
    const intervalId = setInterval(getDraw, 1000); // 120000ms = 2 minutes

    // Cleanup function to clear the interval when component unmounts
    return () => clearInterval(intervalId);
    }
  }, [location.pathname]);

  // NEW
  useEffect(() => {
    const checkAuth = async () => {
      try{
        const user = await API.getUserInfo(); // we have the user info here
        if(user){
          setLoggedIn(true);
          setUser(user);
        }
        else{
          setLoggedIn(false);
          setUser('');
        }
      }
      catch(err) {
        console.error('Error checking authentication:', err);
      }
    };
    checkAuth();
  }, []);

  // NEW
  const handleLogin = async (credentials) => {
    try {
      const user = await API.logIn(credentials);
      setLoggedIn(true);
      setMessage({msg: `Welcome, ${user.name}!`, type: 'success'});
      setUser(user);
    }catch(err) {
      setMessage({msg: err, type: 'danger'});
    }
  };

  // NEW
  const handleLogout = async () => {
    await API.logOut();
    setLoggedIn(false);
    // clean up everything
    setMessage({msg: `Logged out!`, type: 'success'});
  };

  return (
    <Routes>
      <Route element={<>
        {/* UPDATED */}
        <NavHeader loggedIn={loggedIn} handleLogout={handleLogout} />
        <Container fluid className='mt-3'>
          {message && <Row>
            <Alert variant={message.type} onClose={() => setMessage('')} dismissible>{message.msg}</Alert>
          </Row> }
          <Outlet/>
        </Container>
        </>
      }>
        <Route index element={
          <WelcomeLayout loggedIn={loggedIn} user={user}/>
        } />
        <Route path="*" element={ <NotFound/> } />
        {/* NEW */}
        <Route path='/login' element={
          loggedIn ? <Navigate replace to='/' /> : <LoginForm login={handleLogin} />
        } />
        <Route path="/draws" element={
          <DrawLayout draw={draw} loggedIn={loggedIn} user={user}/>
        }/>
        <Route path="/draws/bet" element={
          <BetLayout draw={draw} loggedIn={loggedIn} location={location} user={user}/>
        }/>
        <Route path="/ranking" element={
          <RankingLayout loggedIn={loggedIn}/>
        }/>
      </Route>
    </Routes>
  );

}

export default App;

