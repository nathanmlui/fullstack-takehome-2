import React from "react";
import PageContainer from "../../components/PageContainer";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <PageContainer>
      <h1>Home Page</h1>
      <p>
        Go to <Link to='/market/eth-perp'>Market Page for ETH-PERP</Link>
      </p>
    </PageContainer>
  );
}
