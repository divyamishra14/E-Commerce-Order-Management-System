import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart, items } = useCart();

  const cartItem = items.find((i) => i.product._id === product._id);
  const inCart = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isMaxed = inCart >= product.stock;

  return (
    <div className="product-card">
      <img
        className="product-card-image"
        src={product.imageUrl || `https://via.placeholder.com/400x250/14142a/7c3aed?text=${encodeURIComponent(product.name)}`}
        alt={product.name}
        onError={(e) => {
          e.target.src = `https://placehold.co/400x250/14142a/a78bfa?text=${encodeURIComponent(product.name.substring(0, 15))}`;
        }}
      />
      <div className="product-card-body">
        <span className="product-category">{product.category}</span>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>

        <div className="product-footer">
          <div>
            <div className="product-price">${product.price.toFixed(2)}</div>
            <div className={`product-stock ${isOutOfStock ? 'out' : isLowStock ? 'low' : ''}`}>
              {isOutOfStock
                ? '❌ Out of stock'
                : isLowStock
                ? `⚠️ Only ${product.stock} left`
                : `✅ ${product.stock} in stock`}
            </div>
          </div>

          <button
            id={`add-to-cart-${product._id}`}
            className="btn btn-primary btn-sm"
            disabled={isOutOfStock || isMaxed}
            onClick={() => addToCart(product)}
            title={isMaxed ? `Max available: ${product.stock}` : 'Add to cart'}
          >
            {isOutOfStock
              ? 'Out of Stock'
              : isMaxed
              ? '✓ Max Added'
              : inCart > 0
              ? `+ Add (${inCart})`
              : '+ Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
