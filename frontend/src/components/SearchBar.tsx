import React, { ReactNode } from "react";

export default function SearchBar() {
  return (
    <div className='search-bar light1-bg'>
      <img src='/search-normal.svg' alt='logo' className='logo' />
      <input
        type='text'
        placeholder='SEARCH'
        className='light1-bg search-bar'
      ></input>
    </div>
  );
}
