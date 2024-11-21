import React, { useState } from "react";
import * as Slider from "@radix-ui/react-slider";

export default function BuySellActions() {
  const TAB_OPTIONS: string[] = ["LONG", "SHORT"];
  const ORDER_TYPES: string[] = ["MARKET", "LIMIT", "STOP", "TRAILING STOP"];
  const LEVERAGE_OPTIONS: number[] = [0, 2, 5, 10, 25, 50, 100, 125];
  const [leverage, setLeverage] = useState(0);
  const [selectedTab, setSelectedTab] = useState<string>(TAB_OPTIONS[0]);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

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
              <div className='label'>Open price</div>
              <p>30021.29 USDC</p>
            </div>
          </div>
        </div>
        <div className='action'>
          <div className='label'>Size</div>
          <span className='input-and-coin'>
            <input type='text' />
            <span className='coin-label'>USDC</span>
          </span>
        </div>
        <div className='action'>
          <div className='row'>
            <div className='label'>Leverage</div>
            <p className='current-leverage'>
              {LEVERAGE_OPTIONS[leverage].toString()}x
            </p>
          </div>
          <div className='slider-container'>
            <Slider.Root
              className='slider-root'
              value={[leverage]}
              onValueChange={(value) => setLeverage(value[0])}
              min={0}
              max={LEVERAGE_OPTIONS.length - 1}
              step={1}
            >
              <Slider.Track className='slider-track'>
                <Slider.Range className='slider-range' />
              </Slider.Track>
              <Slider.Thumb className='slider-thumb' />
            </Slider.Root>
            <div className='slider-values'>
              {LEVERAGE_OPTIONS.map((leverageOption, index) => (
                <div
                  key={index}
                  className='slider-value-and-tick'
                  style={{
                    left: `${(index / (LEVERAGE_OPTIONS.length - 1)) * 100}%`,
                  }}
                >
                  <p className='slider-value'>{leverageOption}x</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className='calculated-values'>
        <div className='row'>
          <h4 className='label'>Liquidation Price</h4>
          <p>300,212 USDC</p>
        </div>
        <div className='row'>
          <h4 className='label'>Slippage</h4>
          <p>300,212 USDC (0.3%)</p>
        </div>
        <div className='row'>
          <h4 className='label'>Fee</h4>
          <p>2.00 USDC (0.05%)</p>
        </div>
      </div>
      <div className='advanced' onClick={() => setShowAdvanced(!showAdvanced)}>
        <div className='row'>
          <h4 className='label'>Advanced</h4>
          <img
            src={showAdvanced ? "/caret-up.svg" : "/caret-down.svg"}
            alt={showAdvanced ? "Upward arrow" : "Downward arrow"}
          />
        </div>
        {showAdvanced && <span>Advanced options here</span>}
      </div>
      <button>{selectedTab === "LONG" ? "BUY / LONG" : "SELL / SHORT"}</button>
    </div>
  );
}
