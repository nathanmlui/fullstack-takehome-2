import React, { ReactNode, useState } from "react";

export default function BuySellActions() {
  const TAB_OPTIONS: string[] = ["LONG", "SHORT"];
  const ORDER_TYPES: string[] = ["MARKET", "LIMIT", "STOP", "TRAILING STOP"];
  const [selectedTab, setSelectedTab] = useState<string>(TAB_OPTIONS[0]);

  function handleTabClick(tab: string) {
    setSelectedTab(tab);
  }

  return (
    <div className='buy-sell-actions'>
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
      <div className='actions'>
        <div className='action'>
          <div className='row'>
            <div>
              <div className='label'>Order type</div>
              <select>
                {ORDER_TYPES.map((orderType, index) => (
                  <option key={index} value={orderType}>
                    {orderType}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className='label'>Open Price</div>
              <p>$234</p>
            </div>
          </div>
        </div>
        <div className='action'>
          <div className='label'>Size</div>
          <input type='text' />
        </div>
        <div className='action'>
          <div className='label'>Leverage</div>
          <input type='text' />
        </div>
        <div className='action'>
          <button>Buy</button>
        </div>
      </div>
      <div className='calculated-values'>
        <div className='row'>
          <h4>Liquidation Price</h4>
          <p>300,212 USDC</p>
        </div>
        <div className='row'>
          <h4>Slippage</h4>
          <p>300,212 USDC (0.3%)</p>
        </div>
        <div className='row'>
          <h4>Fee</h4>
          <p>2.00 USDC (0.05%)</p>
        </div>
      </div>
      <button>{selectedTab === "LONG" ? "BUY / LONG" : "SELL / SHORT"}</button>
    </div>
  );
}
