import logo from "./logo.svg";
import "./App.css";
import PageContainer from "./components/PageContainer.tsx";
import React from "react";
import Header from "./components/Header.tsx";

function App() {
  return (
    <div className='App'>
      <PageContainer>
        <Header />
      </PageContainer>
    </div>
  );
}

export default App;
