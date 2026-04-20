import { useState, useEffect } from 'react';
import { shopService } from '../../services';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Store, Mail, Phone, MapPin } from 'lucide-react';
import RatingStars from '../../components/common/RatingStars';

const ShopsList = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const result = await shopService.getShops();
      setShops(result.data);
    } catch (error) {
      console.error('Failed to fetch shops:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Campus Shops</h1>
        <p className="text-gray-600 mt-2">Browse products from campus vendors</p>
      </div>

      {shops.length === 0 ? (
        <div className="card card-body p-12 text-center">
          <Store className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold mb-2">No Shops Available</h3>
          <p className="text-gray-600">Check back later for campus vendors.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <div key={shop._id} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  {shop.avatar ? (
                    <img
                      src={shop.avatar}
                      alt={shop.name}
                      className="w-full h-full rounded-lg object-cover"
                    />
                  ) : (
                    <Store className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{shop.name}</h3>
                  <p className="text-sm text-blue-600 capitalize">{shop.businessType}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <RatingStars rating={shop.rating || 0} size="sm" showValue />
                    <span className="text-sm text-gray-500">({shop.reviewCount || 0} reviews)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                {shop.shopAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{shop.shopAddress}</span>
                  </div>
                )}
                {shop.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{shop.contactEmail}</span>
                  </div>
                )}
                {shop.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{shop.contactPhone}</span>
                  </div>
                )}
              </div>

              <a
                href={`/shops/${shop._id}/products`}
                className="btn-outline w-full justify-center"
              >
                View Products
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopsList;
