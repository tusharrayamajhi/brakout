import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Dashboard from "./page/Dashboard";
import BusinessDetails from "./page/BusinessDetails";
import ProductPage from "./page/ProductManagement";
import SocialMediaPage from "./page/SocialMedia";
import CustomerPage from "./page/customerPage";
import AddProductPage from "./page/AddProductPage";
import EditProductPage from "./page/EditProductPage";
import AddPaymentMethod from "./page/AddPaymentMethod";
import { OrderDetails, Orders } from "./page/orderPage";
import SolanaRedirect from "./page/soalana";
import BusinessDetailsUpdate from "./page/updateBusinessDetails";
import Login from "./page/Login";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

const router = createBrowserRouter([
  { path: "/", element: <Login/> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/business-details", element: <BusinessDetails /> },
  { path: "/products", element: <ProductPage /> },
  { path: "/social-media", element: <SocialMediaPage /> },
  { path: "/customer", element: <CustomerPage /> },
  { path: "/add-product", element: <AddProductPage /> },
  { path: "/edit-product/:id", element: <EditProductPage /> },
  { path: "/payment", element: <AddPaymentMethod /> },
  { path: "/order", element: <Orders /> },
  { path: "/business", element: <BusinessDetailsUpdate /> },
  { path: "/solana/:orderId/:userId/:businessId", element: <SolanaRedirect /> },
  { path: "/order-details/:orderId", element: <OrderDetails /> },
]);

createRoot(rootElement).render(
  // <StrictMode>
    <RouterProvider router={router} />
  // </StrictMode>
);
