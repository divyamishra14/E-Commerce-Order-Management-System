import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import ShopPage from './pages/ShopPage';
import OrderPage from './pages/OrderPage';
import AdminPage from './pages/AdminPage';
import { useState } from 'react';

function App() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <BrowserRouter>
      <CartProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a35',
              color: '#f1f5f9',
              border: '1px solid rgba(124,58,237,0.3)',
              borderRadius: '12px',
              fontFamily: 'Outfit, sans-serif',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />

        <Navbar onCartToggle={() => setCartOpen((o) => !o)} />

        <Routes>
          <Route
  path="/"
  element={
    <ShopPage
      cartOpen={cartOpen}
      onCartClose={() => setCartOpen(false)}
    />
  }
/>
          <Route path="/order/:id" element={<OrderPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
