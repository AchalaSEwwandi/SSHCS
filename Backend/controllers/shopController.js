import User from '../models/User.js';
import Product from '../models/Product.js';

/**
 * GET /api/shops
 * Get all active shops (pharmacies, grocery stores)
 */
export const getShops = async (req, res, next) => {
  try {
    const shops = await User.find({ role: 'shop_owner', isActive: true })
      .select('name avatar shopName businessType shopAddress email contactPhone')
      .lean();

    const { default: Feedback } = await import('../models/Feedback.js');
    const feedbacks = await Feedback.find({ targetType: 'shop' });

    for (const shop of shops) {
      const shopFeedbacks = feedbacks.filter(f => f.targetId.toString() === shop._id.toString());
      if (shopFeedbacks.length > 0) {
        shop.rating = shopFeedbacks.reduce((sum, f) => sum + f.rating, 0) / shopFeedbacks.length;
        shop.reviewCount = shopFeedbacks.length;
      } else {
        shop.rating = 0;
        shop.reviewCount = 0;
      }
    }

    shops.sort((a, b) => b.rating - a.rating || (b.reviewCount - a.reviewCount) || new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, data: shops });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/shops/:shopId
 * Get shop by ID
 */
export const getShop = async (req, res, next) => {
  try {
    const shop = await User.findOne({ _id: req.params.shopId, role: 'shop_owner', isActive: true })
      .select('name avatar shopName businessType shopAddress email contactPhone');
      
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }

    res.json({ success: true, data: shop });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/shops/:shopId/products
 * Get products for a specific shop
 */
export const getProductsByShop = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const products = await Product.find({ shop: shopId, isAvailable: true })
      .sort({ category: 1, name: 1 });

    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/products
 * Create a new product (admin/shop_owner only)
 */
export const createProduct = async (req, res, next) => {
  try {
    const { name, unit, description, category, price, stock, isAvailable, shopName, shop } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }
    if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ success: false, message: 'Price must be a positive number' });
    }

    let image = '';
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    const product = new Product({
      name: name.trim(),
      unit: (unit || '').trim(),
      description: description.trim(),
      category: category.trim(),
      price: Number(price),
      stock: Number(stock || 0),
      isAvailable: isAvailable !== undefined ? String(isAvailable)==='true' : true,     
      storeName: shopName || 'General Store',
      shop: shop || null,
      image,
    });
    await product.save();
    res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/:productId
 * Get a single product
 */
export const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/products/:productId
 * Update a product
 */
export const updateProduct = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (req.file) {
      updates.image = `/uploads/${req.file.filename}`;
    }
    
    if (updates.isAvailable !== undefined) {
      updates.isAvailable = String(updates.isAvailable) === 'true';
    }

    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      updates,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product updated successfully', data: product });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/products/:productId
 * Delete a product
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};
