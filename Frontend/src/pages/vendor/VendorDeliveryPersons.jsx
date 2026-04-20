import { useState, useEffect } from "react";
import { deliveryService } from "../../services/deliveryService";
import { useAuth } from "../../context/AuthContext";
import { Search, Plus, Edit, Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const personSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  phone: z.string().regex(/^(?:0[0-9]{9}|\+94[0-9]{9})$/, "Invalid Sri Lankan phone number (ex: 0712345678 or +94712345678)"),
  nic: z.string().regex(/^([0-9]{9}[vVxX]|[0-9]{12})$/, "Invalid Sri Lankan NIC (ex: 987654321V or 199812345678)"),
  vehicleType: z.enum(["bike", "car", "walk"]),
  vehicleNumber: z.string().regex(/^([A-Za-z]{2,3}|[0-9]{2,3})-[0-9]{4}$/, "Valid format: AB-1234, ABC-1234, or 123-1234").min(2, "Vehicle number required"),
  deliveryArea: z.string().min(2, "Area required"),
  availability: z.enum(["Available", "Busy", "Offline"]).optional(),
});

export default function VendorDeliveryPersons() {
  const [persons, setPersons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const { user } = useAuth(); // Has user.shopName

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: zodResolver(personSchema),
    defaultValues: { vehicleType: 'bike', availability: 'Available' }
  });

  useEffect(() => { 
    if (user) {
      fetchDeliveryPersons(); 
    }
  }, [user]);

  const fetchDeliveryPersons = async () => {
    try {
      setIsLoading(true);
      const storeName = user?.shopName || user?.name || "Vendor Store";
      const res = await deliveryService.getDeliveryPersons(storeName);
      setPersons(res.data || []);
    } catch (error) {
      console.error(error);
      setPersons([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (person = null) => {
    setEditingPerson(person);
    if (person) {
      Object.keys(person).forEach(key => setValue(key, person[key]));
    } else {
      reset({ vehicleType: 'bike', availability: 'Available', email: '', password: '' });
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      // Force storeName to be vendor's shopName, fallback to name
      const storeName = user?.shopName || user?.shopName || user?.name || "Vendor Store";
      const payload = { ...data, storeName };
      
      if (editingPerson) {
        await deliveryService.updateDeliveryPerson(editingPerson._id, payload);
      } else {
        await deliveryService.createDeliveryPerson(payload);
      }
      setIsModalOpen(false);
      fetchDeliveryPersons();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this delivery person?")) return;
    try {
      await deliveryService.deleteDeliveryPerson(id);
      fetchDeliveryPersons();
    } catch (error) {
      alert("Failed to delete");
    }
  };

  const filteredPersons = persons.filter(p => p.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-6 mx-auto space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Delivery Persons Management</h1>
          <p className="text-gray-500">Manage riders assigned to {user?.shopName || user?.name || "your store"}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-white rounded-lg bg-sky-600 hover:bg-sky-700" onClick={() => openModal()}>
          <Plus className="w-5 h-5"/> Add Delivery Person
        </button>
      </div>

      <div className="flex items-center justify-between gap-4 p-4 bg-white border rounded-xl">
        <div className="relative w-96">
          <Search className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
          <input className="w-full py-2 pl-10 pr-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">Loading...</div>
      ) : (
        <div className="overflow-x-auto bg-white border rounded-xl">
          <table className="w-full text-left">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Vehicle</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPersons.map((p) => (
                <tr key={p._id}>
                  <td className="p-4 font-medium">{p.fullName}<div className="text-xs text-gray-500">NIC: {p.nic}</div></td>
                  <td className="p-4 text-gray-600">{p.phone}</td>
                  <td className="p-4 text-gray-600 capitalize">{p.vehicleType} - {p.vehicleNumber}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.availability === 'Available' ? 'bg-accent/10 text-accent-dark' : p.availability === 'Busy' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                      {p.availability}
                    </span>
                  </td>
                  <td className="flex gap-2 p-4">
                    <button onClick={() => openModal(p)} className="p-2 bg-gray-100 rounded hover:bg-gray-200"><Edit className="w-4 h-4 text-gray-700"/></button> 
                    <button onClick={() => handleDelete(p._id)} className="p-2 rounded bg-red-50 hover:bg-red-100"><Trash2 className="w-4 h-4 text-red-600"/></button>
                  </td>
                </tr>
              ))}
              {filteredPersons.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-500">No delivery persons found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">    
              <h2 className="text-xl font-bold">{editingPerson ? 'Edit' : 'Add'} Delivery Person</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="text-gray-500 hover:text-gray-800"/></button>       
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">  
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block mb-1 text-sm font-medium">Full Name *</label>
                  <input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600" {...register("fullName")} />
                  <p className="mt-1 text-xs text-red-500">{errors.fullName?.message}</p>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block mb-1 text-sm font-medium">Phone *</label>
                  <input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600" {...register("phone")} />
                  <p className="mt-1 text-xs text-red-500">{errors.phone?.message}</p>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block mb-1 text-sm font-medium">NIC *</label>
                  <input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600" {...register("nic")} />
                  <p className="mt-1 text-xs text-red-500">{errors.nic?.message}</p>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block mb-1 text-sm font-medium">Area *</label>
                  <input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600" {...register("deliveryArea")} />
                  <p className="mt-1 text-xs text-red-500">{errors.deliveryArea?.message}</p>
                </div>

                {!editingPerson && (
                  <>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block mb-1 text-sm font-medium">Account Email (Optional)</label>
                      <input type="email" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600" {...register("email")} placeholder="Auto-generated if empty" />
                      <p className="mt-1 text-xs text-gray-400">Default: [nic]@delivery.com</p>
                      <p className="mt-1 text-xs text-red-500">{errors.email?.message}</p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block mb-1 text-sm font-medium">Password (Optional)</label>
                      <input type="password" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600" {...register("password")} placeholder="Defaults to NIC" />
                      <p className="mt-1 text-xs text-gray-400">Minimum 6 characters</p>
                      <p className="mt-1 text-xs text-red-500">{errors.password?.message}</p>
                    </div>
                  </>
                )}

                <div className="col-span-2 md:col-span-1">
                  <label className="block mb-1 text-sm font-medium">Vehicle Type *</label>
                  <select className="w-full px-4 py-2 bg-white border rounded-lg focus:ring-2 focus:ring-blue-600" {...register("vehicleType")}>      
                    <option value="bike">Bike</option>
                    <option value="car">Car / Van</option>
                    <option value="walk">Walk</option>
                  </select>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block mb-1 text-sm font-medium">Vehicle Number *</label>
                  <input className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600" {...register("vehicleNumber")} />
                  <p className="mt-1 text-xs text-red-500">{errors.vehicleNumber?.message}</p>
                </div>
                
                <div className="col-span-2">
                  <label className="block mb-1 text-sm font-medium">Availability</label>
                  <select className="w-full px-4 py-2 bg-white border rounded-lg focus:ring-2 focus:ring-blue-600" {...register("availability")}>     
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" className="px-6 py-2 font-medium text-white rounded-lg bg-sky-600 hover:bg-sky-700">Save Person</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
