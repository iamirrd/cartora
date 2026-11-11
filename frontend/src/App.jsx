import React from "react";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Header from "./components/Header.jsx";
import CatalogPage from "./features/catalog/CatalogPage.jsx";
import ProductPage from "./features/catalog/ProductPage.jsx";
import {
  AuthProvider,
  RequireAuth,
  useAuth,
} from "./features/auth/AuthContext.jsx";
import AuthPage from "./features/auth/AuthPage.jsx";
import AccountPage from "./features/auth/AccountPage.jsx";
import { CartProvider } from "./features/cart/CartContext.jsx";
import CartPage from "./features/cart/CartPage.jsx";
import AddressesPage from "./features/addresses/AddressesPage.jsx";
import CheckoutPage from "./features/checkout/CheckoutPage.jsx";
import OrdersPage from "./features/orders/OrdersPage.jsx";
import OrderPage from "./features/orders/OrderPage.jsx";
import WishlistPage from "./features/wishlist/WishlistPage.jsx";
import NotificationsPage from "./features/notifications/NotificationsPage.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
function PrivatePage({ children }) {
  const { user } = useAuth();
  return (
    <RequireAuth>
      <React.Fragment key={user?.email}>{children}</React.Fragment>
    </RequireAuth>
  );
}
function Storefront() {
  const { user } = useAuth();
  return (
    <div className="app">
      <ScrollToTop />
      <a className="skip-link" href="#main">
        رفتن به محتوای اصلی
      </a>
      <Header />
      <main id="main">
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route
            path="/products/:id"
            element={<ProductPage key={user?.email || "guest"} />}
          />
          <Route path="/login" element={<AuthPage key="login" />} />
          <Route
            path="/register"
            element={<AuthPage key="register" register />}
          />
          <Route
            path="/account"
            element={
              <PrivatePage>
                <AccountPage />
              </PrivatePage>
            }
          />
          <Route
            path="/cart"
            element={
              <PrivatePage>
                <CartPage />
              </PrivatePage>
            }
          />
          <Route
            path="/addresses"
            element={
              <PrivatePage>
                <AddressesPage />
              </PrivatePage>
            }
          />
          <Route
            path="/checkout"
            element={
              <PrivatePage>
                <CheckoutPage />
              </PrivatePage>
            }
          />
          <Route
            path="/orders"
            element={
              <PrivatePage>
                <OrdersPage />
              </PrivatePage>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <PrivatePage>
                <OrderPage />
              </PrivatePage>
            }
          />
          <Route
            path="/wishlist"
            element={
              <PrivatePage>
                <WishlistPage />
              </PrivatePage>
            }
          />
          <Route
            path="/notifications"
            element={
              <PrivatePage>
                <NotificationsPage />
              </PrivatePage>
            }
          />
          <Route
            path="*"
            element={
              <section className="page state">
                <h1>صفحه پیدا نشد</h1>
                <Link className="button" to="/">
                  بازگشت به فروشگاه
                </Link>
              </section>
            }
          />
        </Routes>
      </main>
      <footer>
        <Link className="logo" to="/">
          کارتورا.
        </Link>
        <p>هر روز، فرصتی برای یک انتخاب تازه.</p>
        <Link to="/account">حساب کاربری ←</Link>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Storefront />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
