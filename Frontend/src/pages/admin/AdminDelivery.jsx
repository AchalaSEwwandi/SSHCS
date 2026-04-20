import { useState, useEffect } from "react";
import { deliveryService } from "../../services/deliveryService";
import { Search, Plus, MapPin, Truck, CheckCircle, Clock, Edit, Trash2, X } from "lucide-react"; 
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const personSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Valid phone required"),
  nic: z.string().min(9, "Valid NIC required"),
  storeName: z.string().min(2, "Store name required"),
  vehicleType: z.enum(["Bike", "Car/Van"]),
  vehicleNumber: z.string().min(2, "Vehicle number required"),
  deliveryArea: z.string().min(2, "Area required"),
  availability: z.enum(["Available", "Busy", "Offline"]),
});

export default function AdminDelivery() {
  const [persons, setPersons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: zodResolver(personSchema),
    defaultValues: { vehicleType: 'Bike', availability: 'Available' }
  });

  useEffect(() => { fetchDeliveryPersons(); }, []);

  const fetchDeliveryPersons = async () => {
    try {
      setIsLoading(true);
      const res = await deliveryService.getDeliveryPersons();
      setPersons(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (person = null) => {
    setEditingPerson(person);
    if (person) {
      Object.keys(person).forEach(key => setValue(key, person[key]));
    } else {
      reset({ vehicleType: 'Bike', availability: 'Available' });
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingPerson) await deliveryService.updateDeliveryPerson(editingPerson._id, data);
      else await deliveryService.createDeliveryPerson(data);
      setIsModalOpen(false);
      fetchDeliveryPersons();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete delivery person?")) return;
    try {
      await deliveryService.deleteDeliveryPerson(id);
      fetchDeliveryPersons();
    } catch (error) {
      alert("Failed to delete");
    }
  };

  const filteredPersons = persons.filter(p => (p.fullName + p.storeName).toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold">Delivery Management</h1></div>
        <button className="flex items-center gap-2 btn-primary" onClick={() => openModal()}><Plus className="w-5 h-5"/> Add Personnel</button>
      </div>

      <div className="bg-white border rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="relative w-96">
          <Search className="absolute w-5 h-5 text-gray-400 left-3 top-1/2 -translate-y-1/2" />
          <input className="input pl-10" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl border">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">Name</th><th className="p-4">Phone</th><th className="p-4">Store</th>
              <th className="p-4">Vehicle</th><th className="p-4">Status</th><th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredPersons.map(p => (
              <tr key={p._id}>
                <td className="p-4 font-medium">{p.fullName}<div className="text-xs text-gray-500">NIC: {p.nic}</div></td>
                <td className="p-4 text-gray-600">{p.phone}</td>
                <td className="p-4 font-medium"><MapPin className="w-4 h-4 inline mr-1"/>{p.storeName}</td>
                <td className="p-4 text-gray-600">{p.vehicleType} - {p.vehicleNumber}</td>
                <td className="p-4">{p.availability === "Available" ? <span className="text-accent-dark font-bold">Available</span> : <span className="text-orange-600 font-bold">{p.availability}</span>}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => openModal(p)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded"><Edit className="w-4 h-4 text-gray-700"/></button>
                  <button onClick={() => handleDelete(p._id)} className="p-2 bg-red-50 hover:bg-red-100 rounded"><Trash2 className="w-4 h-4 text-red-600"/></button>
                </td>
              </tr>
            ))}
            {filteredPersons.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-gray-500">No personnel found</td></tr>}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">{editingPerson ? 'Edit' : 'Add'} Delivery Person</h2>
              <button onClick={() => setIsModalOpen(false)}><X/></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="form-label">Full Name</label><input className="input" {...register("fullName")} /><p className="text-red-500 text-xs">{errors.fullName?.message}</p></div>
                <div><label className="form-label">Phone</label><input className="input" {...register("phone")} /><p className="text-red-500 text-xs">{errors.phone?.message}</p></div>
                <div><label className="form-label">NIC</label><input className="input" {...register("nic")} /><p className="text-red-500 text-xs">{errors.nic?.message}</p></div>
                <div><label className="form-label">Store Assigned</label><input className="input" {...register("storeName")} /><p className="text-red-500 text-xs">{errors.storeName?.message}</p></div>
                <div><label className="form-label">Vehicle Type</label>
                  <select className="select" {...register("vehicleType")}>
                    <option value="Bike">Bike</option><option value="Car/Van">Car/Van</option>
                  </select>
                </div>
                <div><label className="form-label">Vehicle Num</label><input className="input" {...register("vehicleNumber")} /><p className="text-red-500 text-xs">{errors.vehicleNumber?.message}</p></div>
                <div><label className="form-label">Delivery Area</label><input className="input" {...register("deliveryArea")} /><p className="text-red-500 text-xs">{errors.deliveryArea?.message}</p></div>
                <div><label className="form-label">Availability</label>
                  <select className="select" {...register("availability")}>
                    <option value="Available">Available</option><option value="Busy">Busy</option><option value="Offline">Offline</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4"><button type="submit" className="btn-primary px-8">Save</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
