import React, { ReactNode } from "react";
import SearchBar from "./SearchBar";
import AccountMenu from "./AccountMenu";
import CoinInfoRow from "./CoinInfoRow";

export default function Header() {
  return (
    <>
      <div className='header'>
        <SearchBar />
        <AccountMenu />
      </div>
      <CoinInfoRow />
    </>
  );
}
