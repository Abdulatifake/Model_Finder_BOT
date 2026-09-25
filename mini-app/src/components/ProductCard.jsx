import { useApp } from '../context.js';

export default function ProductCard({ product }) {
  const { favorites, toggleFavorite, openProduct } = useApp();
  const isFavorite = favorites.has(product.id);

  return (
    <div className="product-card" onClick={() => openProduct(product)}>
      <div className="product-card-image">
        <img src={product.previewImageUrl} alt={product.name} loading="lazy" />
        <button
          className={`favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
        >
          ❤️
        </button>
        {product.similarity != null && <span className="similarity-badge">{Math.round(product.similarity * 100)}%</span>}
      </div>
      <div className="product-card-body">
        <div className="product-card-name">{product.name}</div>
        <div className="product-card-category">{product.categoryLabel}</div>
      </div>
    </div>
  );
}
