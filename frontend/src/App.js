import logo from "./logo.svg";
import "./App.css";
import PageContainer from "./components/PageContainer.tsx";
import React from "react";
import Header from "./components/Header.tsx";
import CoinChart from "./components/CoinChart.tsx";
import BuySellActions from "./components/BuySellActions.tsx";

function App() {
  return (
    <div className='App'>
      <PageContainer>
        <Header />
        <div className='graph-and-actions'>
          <CoinChart />
          <BuySellActions />
        </div>
      </PageContainer>
    </div>
  );
}

export default App;
