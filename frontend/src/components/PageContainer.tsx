import React, { ReactNode } from "react";

export default function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className='container mx-auto px-8 py-3 flex flex-col'>{children}</div>
  );
}
