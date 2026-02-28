import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export const MAX_PRODUCTS = 5;

const STORAGE_KEY_PRODUCTS = '@yip_products';
const STORAGE_KEY_FAVORITES = '@yip_favorites';

export interface Product {
  id: string;
  name: string;
  photo: string;
  price: string;
}

interface ProductsContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  removeProduct: (id: string) => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  isLimitReached: boolean;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [storedProducts, storedFavorites] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_PRODUCTS),
          AsyncStorage.getItem(STORAGE_KEY_FAVORITES),
        ]);
        if (storedProducts) {
          const parsed = JSON.parse(storedProducts) as Product[];
          if (Array.isArray(parsed)) setProducts(parsed);
        }
        if (storedFavorites) {
          const parsed = JSON.parse(storedFavorites) as string[];
          if (Array.isArray(parsed)) setFavorites(new Set(parsed));
        }
      } catch {
        // Ignore load errors
      } finally {
        setIsHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products)).catch(() => {});
  }, [products, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify([...favorites])).catch(() => {});
  }, [favorites, isHydrated]);

  const addProduct = useCallback((product: Omit<Product, 'id'>) => {
    setProducts((prev) => {
      if (prev.length >= MAX_PRODUCTS) return prev;
      const newProduct: Product = {
        ...product,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      };
      return [...prev, newProduct];
    });
  }, []);

  const removeProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setFavorites((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.has(id),
    [favorites]
  );

  const isLimitReached = products.length >= MAX_PRODUCTS;

  return (
    <ProductsContext.Provider
      value={{
        products,
        addProduct,
        removeProduct,
        toggleFavorite,
        isFavorite,
        isLimitReached,
      }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}
