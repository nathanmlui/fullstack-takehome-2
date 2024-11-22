import React, { useState } from "react";
import PageContainer from "../../components/PageContainer";
import Header from "./components/Header";
import CoinChart from "./components/CoinChart";
import BuySellActions from "./components/BuySellActions";

export default function MarketPage() {
  const [symbol, setSymbol] = useState<string>("ETH-PERP"); // Can be read from URL Params in future
  return (
    <PageContainer>
      <PageContainer>
        <Header />
        <div className='graph-and-actions'>
          <CoinChart />
          <BuySellActions />
        </div>
      </PageContainer>
    </PageContainer>
  );
}
