import React, { ReactNode } from "react";

export default function SearchBar() {
  return (
    <div className='search-bar'>
      <img src='/search-normal.svg' alt='logo' className='logo' />
      <input type='text' placeholder='SEARCH'></input>
    </div>
  );
}
