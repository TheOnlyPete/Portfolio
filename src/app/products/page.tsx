"use client";

import products from "../../../content/products.json";
import SiteHeader from "../components/SiteHeader";

export default function ProductsPage() {
  return (
    <main className="products-store-page">
      <SiteHeader />
      <header className="products-store-heading">
        <p>Products</p>
        <h1>Software built to be used.</h1>
        <span>Products I design, build and support—not just technical experiments.</span>
      </header>
      <section className="products-store-grid">
        {products.map(product => <article className="product-store-card" key={product.slug}>
          <a className="product-store-image" href={`/products/${product.slug}`}>
            {product.image ? <img src={product.image} alt="" /> : <span>{product.title.charAt(0)}</span>}
          </a>
          <div className="product-store-copy">
            <p>Available product</p>
            <h2><a href={`/products/${product.slug}`}>{product.title}</a></h2>
            <span>{product.summary}</span>
            <a className="product-store-link" href={`/products/${product.slug}`}>View product <i>→</i></a>
          </div>
        </article>)}
      </section>
    </main>
  );
}
