import React, { ReactNode } from "react";

export default function AccountMenu() {
  return (
    <div className='account-menu'>
      <button className='notifications'>
        <img src='/notification.svg' alt='Notification icon' />
      </button>
      <div className='account'>
        <p>93847lkajsdfhsdkj</p>
        <img src='/downArrow.svg' alt='Downward facing arrow' />
      </div>
    </div>
  );
}
