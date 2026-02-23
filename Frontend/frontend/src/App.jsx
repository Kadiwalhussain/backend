import React from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import CreatePost from "./pages/CreatePost";
import "./App.css";

const App = () => {
  return (
    <Router>
      <div className="app-shell">
        <header className="topbar">
          <h1>Post Studio</h1>
          <nav className="topbar-nav">
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/create-post">Create Post</NavLink>
          </nav>
        </header>

        <main className="page-wrap">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create-post" element={<CreatePost />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;