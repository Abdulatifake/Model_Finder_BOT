import ProductCard from './ProductCard.jsx';

export default function ProductGrid({ items, emptyText }) {
  if (!items.length) return <div className="empty-state">{emptyText}</div>;
  return (
    <div className="product-grid">
      {items.map((item) => (
        <ProductCard key={item.id} product={item} />
      ))}
    </div>
  );
}
