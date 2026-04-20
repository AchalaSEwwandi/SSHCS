import { useState, useEffect } from 'react';
import { shopService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Plus, Edit, Trash2, Package, X, Image as ImageIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  category: z.string().min(1, 'Category is required'),
  unit: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  price: z.string().min(1, 'Price is required').refine(val => !isNaN(Number(val)) && Number(val) >= 0, 'Must be a positive number'),
  stock: z.string().min(1, 'Stock is required').refine(val => !isNaN(Number(val)) && Number(val) >= 0, 'Must be a positive number'),
  isAvailable: z.boolean().default(true),
  image: z.any().optional()
});

const VendorProducts = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category: '',
      unit: '',
      description: '',
      price: '',
      stock: '',
      isAvailable: true,
    }
  });

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    const shopId = user?._id || user?.id;
    if (!shopId) {
      setLoading(false);
      return;
    }
    try {
      const result = await shopService.getProductsByShop(shopId);
      setProducts(result.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const onImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValue('image', file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('category', data.category);
      if (data.unit) formData.append('unit', data.unit);
      formData.append('description', data.description);
      formData.append('price', data.price);
      formData.append('stock', data.stock);
      formData.append('isAvailable', data.isAvailable);
      formData.append('shopName', user?.shopName || user?.name || 'Campus Store');
      formData.append('shop', user?._id || user?.id);

      if (data.image && data.image instanceof File) {
        formData.append('image', data.image);
      }

      if (editingProduct) {
        await shopService.updateProduct(editingProduct._id, formData);
        alert('Product updated successfully!');
      } else {
        await shopService.createProduct(formData);
        alert('Product created successfully!');
      }

      closeModal();
      fetchProducts();
    } catch (error) {
      alert('Failed to save product: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      category: product.category || '',
      unit: product.unit || '',
      description: product.description || '',
      price: product.price.toString(),
      stock: (product.stock || 0).toString(),
      isAvailable: product.isAvailable,
    });
    setImagePreview(product.image ? `http://localhost:5000${product.image}` : null);
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await shopService.deleteProduct(productId);
      fetchProducts();
      alert('Product deleted successfully!');
    } catch (error) {
      alert('Failed to delete product: ' + (error.response?.data?.message || error.message));
    }
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingProduct(null);
    setImagePreview(null);
    reset({
      name: '',
      category: '',
      unit: '',
      description: '',
      price: '',
      stock: '',
      isAvailable: true,
      image: undefined
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products Inventory</h1>
          <p className="mt-2 text-gray-600">Manage and update your shop's stock</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 shadow-sm btn-primary">
          <Plus className="w-5 h-5" /> Add Product
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
                <Package className="w-6 h-6 text-primary-600" />
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button type="button" onClick={closeModal} className="p-2 text-gray-400 transition-colors rounded-full hover:text-gray-600 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700 form-label">Product Name *</label>
                    <input type="text" {...register('name')} className={`input ${errors.name ? 'border-red-500' : ''}`} placeholder="e.g., Paracetamol 500mg" />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 form-label">Category *</label>
                    <select {...register('category')} className={`input ${errors.category ? 'border-red-500' : ''}`}>
                      <option value="">Select a category</option>
                      <option value="Medicines">Medicines</option>
                      <option value="Snacks">Snacks</option>
                      <option value="Groceries">Groceries</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Stationery">Stationery</option>
                      <option value="Personal Care">Personal Care</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 form-label">Unit (optional)</label>
                    <input type="text" {...register('unit')} className="input" placeholder="e.g., 10 tablets, 500g" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700 form-label">Description *</label>
                    <textarea {...register('description')} rows={3} className={`textarea ${errors.description ? 'border-red-500' : ''}`} placeholder="Product description..." />
                    {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 form-label">Price (LKR) *</label>
                    <input type="number" step="0.01" {...register('price')} className={`input ${errors.price ? 'border-red-500' : ''}`} placeholder="100.00" />
                    {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 form-label">Stock Quantity *</label>
                    <input type="number" {...register('stock')} className={`input ${errors.stock ? 'border-red-500' : ''}`} placeholder="50" />
                    {errors.stock && <p className="mt-1 text-xs text-red-500">{errors.stock.message}</p>}
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700 form-label">Product Image (optional)</label>
                    <div className="flex items-center gap-6">
                      {imagePreview ? (
                        <div className="relative w-32 h-32 overflow-hidden border rounded-lg shrink-0 group">
                          <img src={imagePreview} alt="Preview" className="object-cover w-full h-full" />
                          <button type="button" onClick={() => { setImagePreview(null); setValue('image', undefined); }} className="absolute p-1 text-white transition-opacity bg-red-500 rounded-full opacity-0 top-1 right-1 group-hover:opacity-100">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-32 h-32 text-gray-400 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 shrink-0">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                      <div className="flex-1">
                        <input type="file" accept="image/*" onChange={onImageChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer" />
                        <p className="mt-2 text-xs text-gray-500">PNG, JPG, JPEG up to 5MB</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 md:col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center">
                         <input type="checkbox" {...register('isAvailable')} className="w-5 h-5 border-gray-300 rounded text-primary-600 focus:ring-primary-500" />
                      </div>
                      <span className="text-sm font-medium text-gray-800 group-hover:text-gray-900">Available for purchase immediately</span>
                    </label>
                  </div>
                </div>
              </form>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <button type="button" onClick={closeModal} className="px-6 btn-outline">Cancel</button>
              <button type="submit" form="product-form" className="px-8 btn-primary">
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="p-12 text-center bg-white border-2 border-gray-200 border-dashed card">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 rounded-full bg-gray-50">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-900">No Products Yet</h3>
          <p className="max-w-sm mx-auto mb-6 text-gray-500">Start building your shop's inventory by adding your first product. You can update details and availability anytime.</p>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center justify-center w-auto mx-auto btn-primary">
            <Plus className="w-5 h-5 mr-2" /> Add Your First Product
          </button>
        </div>
      ) : (
        <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-sm border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 font-semibold text-gray-900">Product Details</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Category</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Price</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Inventory</th>
                  <th className="px-6 py-4 font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 font-semibold text-right text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <tr key={product._id} className="transition-colors hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {product.image ? (
                          <img src={`http://localhost:5000${product.image}`} alt={product.name} className="object-cover w-12 h-12 bg-gray-100 border border-gray-200 rounded shadow-sm" />
                        ) : (
                          <div className="flex items-center justify-center w-12 h-12 text-gray-400 bg-gray-100 border border-gray-200 rounded">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate" title={product.description}>{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">LKR {product.price?.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-700">{product.stock || 0}</span>
                        {product.unit && <span className="text-sm text-gray-500">/ {product.unit}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${product.isAvailable ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${product.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {product.isAvailable ? 'Available' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(product)} className="p-2 text-blue-600 transition-colors border border-transparent rounded-lg hover:bg-blue-50 hover:border-blue-100" title="Edit Product">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(product._id)} className="p-2 text-red-600 transition-colors border border-transparent rounded-lg hover:bg-red-50 hover:border-red-100" title="Delete Product">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorProducts;
