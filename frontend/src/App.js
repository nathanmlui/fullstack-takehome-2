import "./App.css";

import MarketPage from "./pages/market/index.tsx";
import Home from "./pages/home/index.tsx";
import React from "react";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <div className='App'>
      <Router>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/market/:marketSymbol' element={<MarketPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
