import React, { useState } from "react";
import PageContainer from "../../components/PageContainer";
import Header from "./components/Header";
import CoinChart from "./components/CoinChart";
import BuySellActions from "./components/BuySellActions";

export default function MarketPage() {
  const TAB_OPTIONS: string[] = ["PRICE", "FUNDING"];
  const [selectedTab, setSelectedTab] = useState<string>(TAB_OPTIONS[0]);

  function handleTabClick(tab: string) {
    setSelectedTab(tab);
  }
  return (
    <PageContainer>
      <PageContainer>
        <Header />
        <div className='market-page-content'>
          <div className='tabs'>
            {TAB_OPTIONS.map((tab, index) => (
              <div
                key={index}
                className={`tab ${selectedTab === tab ? "active" : ""}`}
                onClick={() => handleTabClick(tab)}
              >
                {tab}
              </div>
            ))}
          </div>
          {selectedTab === "PRICE" && (
            <div className='graph-and-actions'>
              <CoinChart />
              <BuySellActions />
            </div>
          )}
        </div>
      </PageContainer>
    </PageContainer>
  );
}
