import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { deleteProductImage } from '@/utils/storage';

export const MAX_PRODUCTS = 5;

const STORAGE_KEYS = {
  products: '@YipOnlineTask/products',
  favorites: '@YipOnlineTask/favorites',
};

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
  isLoading: boolean;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [productsJson, favoritesJson] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.products),
          AsyncStorage.getItem(STORAGE_KEYS.favorites),
        ]);
        if (productsJson) {
          const parsed = JSON.parse(productsJson) as Product[];
          setProducts(Array.isArray(parsed) ? parsed : []);
        }
        if (favoritesJson) {
          const parsed = JSON.parse(favoritesJson) as string[];
          setFavorites(new Set(Array.isArray(parsed) ? parsed : []));
        }
      } catch {
        // Ignore load errors
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
    }
  }, [products, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify([...favorites]));
    }
  }, [favorites, isLoading]);

  const addProduct = useCallback((product: Omit<Product, 'id'>) => {
    setProducts((prev) => {
      if (prev.length >= MAX_PRODUCTS) return prev;
      const newProduct: Product = {
        ...product,
        id: Date.now().toString(),
      };
      return [...prev, newProduct];
    });
  }, []);

  const removeProduct = useCallback((id: string) => {
    setProducts((prev) => {
      const product = prev.find((p) => p.id === id);
      if (product?.photo && product.photo.includes('product_images')) {
        deleteProductImage(product.photo);
      }
      return prev.filter((p) => p.id !== id);
    });
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
        isLoading,
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
