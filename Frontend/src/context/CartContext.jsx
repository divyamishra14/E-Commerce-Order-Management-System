import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

/**
 * Generates a UUID v4 idempotency key for the current checkout session.
 * Each time the cart is cleared (post-order), a new key is generated on next checkout.
 */
const generateIdempotencyKey = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]); // { product, quantity }
  const [idempotencyKey, setIdempotencyKey] = useState(generateIdempotencyKey);

  const addToCart = useCallback((product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product._id === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // respect stock limit
        return prev.map((i) =>
          i.product._id === product._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      if (product.stock < 1) return prev; // can't add out-of-stock items
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.product._id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, quantity, maxStock) => {
    if (quantity < 1) {
      setItems((prev) => prev.filter((i) => i.product._id !== productId));
      return;
    }
    if (quantity > maxStock) return; // enforce stock limit
    setItems((prev) =>
      prev.map((i) => (i.product._id === productId ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    // Generate fresh key for the next checkout session
    setIdempotencyKey(generateIdempotencyKey());
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalAmount,
        idempotencyKey,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};
