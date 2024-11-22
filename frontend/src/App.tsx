import "./App.css";

import MarketPage from "./pages/market/index";
import Home from "./pages/home/index";
import React from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

function App() {
  return (
    <div className='App'>
      <Router>
        <Routes>
          {/* Forward to one of the market page that I created for this demo */}
          <Route path='/' element={<Navigate to='/market/eth-perp' />} />
          <Route path='/market/:marketSymbol' element={<MarketPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
