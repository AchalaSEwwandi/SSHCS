import api from './api';

export const shopService = {
  // Shops
  getShops: async () => {
    const response = await api.get('/shops');
    return response.data;
  },

  getShopById: async (shopId) => {
    const response = await api.get(`/shops/${shopId}`);
    return response.data;
  },

  // Products
  getProductsByShop: async (shopId) => {
    const response = await api.get(`/shops/${shopId}/products`);
    return response.data;
  },

  createProduct: async (productData) => {
    const response = await api.post('/products', productData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateProduct: async (productId, productData) => {
    const response = await api.put(`/products/${productId}`, productData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteProduct: async (productId) => {
    const response = await api.delete(`/products/${productId}`);
    return response.data;
  },
};
