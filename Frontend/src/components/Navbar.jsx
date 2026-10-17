import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Navbar = ({ onCartToggle }) => {
  const { totalItems } = useCart();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        ⚡ SAHARA
      </Link>

      <div className="navbar-actions">
        {!isAdmin && (
          <Link to="/admin" className="btn btn-secondary btn-sm">
            🛠️ Admin
          </Link>
        )}
        {isAdmin && (
          <Link to="/" className="btn btn-secondary btn-sm">
            🛒 Shop
          </Link>
        )}
        {!isAdmin && (
          <button
            id="cart-toggle-btn"
            className="btn btn-secondary btn-sm"
            onClick={onCartToggle}
            style={{ position: 'relative' }}
          >
            🛒 Cart
            {totalItems > 0 && (
              <span
                className="cart-badge"
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                }}
              >
                {totalItems}
              </span>
            )}
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
