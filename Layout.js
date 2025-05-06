import React from "react";
import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";

export default function Layout() {
  return (
    <div style={{ paddingBottom: "70px" }}> {/* Leave space for NavBar */}
      <Outlet />
      <NavBar />
    </div>
  );
}
