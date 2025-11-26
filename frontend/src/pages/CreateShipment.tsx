import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { shipmentApi } from '../utils/api';

export function CreateShipment() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    shipment_number: '',
    device_id: '',
    route: {
      origin: '',
      destination: '',
      waypoints: [] as string[],
    },
    po_number: '',
    ndc_number: '',
    serial_numbers: [''],
    container_number: '',
    goods_type: '',
    expected_delivery_date: '',
    delivery_number: '',
    batch_id: '',
    description: '',
    status: 'pending',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waypointInput, setWaypointInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Filter out empty serial numbers
      const serialNumbers = formData.serial_numbers.filter(sn => sn.trim() !== '');
      
      // Prepare data matching backend model
      const shipmentData = {
        shipment_number: formData.shipment_number,
        device_id: formData.device_id,
        route: {
          origin: formData.route.origin,
          destination: formData.route.destination,
          waypoints: formData.route.waypoints.length > 0 ? formData.route.waypoints : undefined,
        },
        po_number: formData.po_number,
        ndc_number: formData.ndc_number,
        serial_numbers: serialNumbers,
        container_number: formData.container_number,
        goods_type: formData.goods_type,
        expected_delivery_date: formData.expected_delivery_date,
        delivery_number: formData.delivery_number,
        batch_id: formData.batch_id,
        description: formData.description || undefined,
        status: formData.status,
      };

      await shipmentApi.create(shipmentData);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create shipment');
    } finally {
      setLoading(false);
    }
  };

  const addSerialNumber = () => {
    setFormData({
      ...formData,
      serial_numbers: [...formData.serial_numbers, ''],
    });
  };

  const updateSerialNumber = (index: number, value: string) => {
    const newSerialNumbers = [...formData.serial_numbers];
    newSerialNumbers[index] = value;
    setFormData({ ...formData, serial_numbers: newSerialNumbers });
  };

  const removeSerialNumber = (index: number) => {
    const newSerialNumbers = formData.serial_numbers.filter((_, i) => i !== index);
    setFormData({ ...formData, serial_numbers: newSerialNumbers.length > 0 ? newSerialNumbers : [''] });
  };

  const addWaypoint = () => {
    if (waypointInput.trim()) {
      setFormData({
        ...formData,
        route: {
          ...formData.route,
          waypoints: [...formData.route.waypoints, waypointInput.trim()],
        },
      });
      setWaypointInput('');
    }
  };

  const removeWaypoint = (index: number) => {
    setFormData({
      ...formData,
      route: {
        ...formData.route,
        waypoints: formData.route.waypoints.filter((_, i) => i !== index),
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-white mb-2 text-2xl font-bold">Create Shipment</h1>
          <p className="text-[#8b92a7]">Create a new shipment with device tracking</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#0f1729] border border-[#1e2a45] rounded p-8 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-white text-lg font-semibold border-b border-[#1e2a45] pb-2">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="shipment_number" className="block text-white mb-2">
                  Shipment Number *
                </label>
                <input
                  id="shipment_number"
                  type="text"
                  required
                  minLength={5}
                  maxLength={20}
                  value={formData.shipment_number}
                  onChange={(e) => setFormData({ ...formData, shipment_number: e.target.value })}
                  className="w-full px-4 py-3 bg-[#151d30] border border-[#1e2a45] rounded text-white placeholder-[#4a5568] focus:outline-none focus:border-[#3b82f6]"
                  placeholder="e.g., SHIP-001"
                />
              </div>

              <div>
                <label htmlFor="device_id" className="block text-white mb-2">
                  Device ID *
                </label>
                <input
                  id="device_id"
                  type="text"
                  required
                  value={formData.device_id}
                  onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                  className="w-full px-4 py-3 bg-[#151d30] border border-[#1e2a45] rounded text-white placeholder-[#4a5568] focus:outline-none focus:border-[#3b82f6]"
                  placeholder="e.g., 1150"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="po_number" className="block text-white mb-2">
                  Purchase Order Number *
                </label>
                <input
                  id="po_number"
                  type="text"
                  required
                  value={formData.po_number}
                  onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                  className="w-full px-4 py-3 bg-[#151d30] border border-[#1e2a45] rounded text-white placeholder-[#4a5568] focus:outline-none focus:border-[#3b82f6]"
                  placeholder="PO-12345"
                />
              </div>

              <div>
                <label htmlFor="ndc_number" className="block text-white mb-2">
                  NDC Number *
                </label>
                <input
                  id="ndc_number"
                  type="text"
                  required
                  value={formData.ndc_number}
                  onChange={(e) => setFormData({ ...formData, ndc_number: e.target.value })}
                  className="w-full px-4 py-3 bg-[#151d30] border border-[#1e2a45] rounded text-white placeholder-[#4a5568] focus:outline-none focus:border-[#3b82f6]"
                  placeholder="NDC-12345"
                />
              </div>
            </div>
          </div>

          {/* Route Information */}
          <div className="space-y-4">
            <h2 className="text-white text-lg font-semibold border-b border-[#1e2a45] pb-2">Route Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="origin" className="block text-white mb-2">
                  Origin *
                </label>
                <input
                  id="origin"
                  type="text"
                  required
                  value={formData.route.origin}
                  onChange={(e) => setFormData({ ...formData, route: { ...formData.route, origin: e.target.value } })}
                  className="w-full px-4 py-3 bg-[#151d30] border border-[#1e2a45] rounded text-white placeholder-[#4a5568] focus:outline-none focus:border-[#3b82f6]"
                  placeholder="e.g., New York, USA"
                />
              </div>

              <div>
                <label htmlFor="destination" className="block text-white mb-2">
                  Destination *
                </label>
                <input
                  id="destination"
                  type="text"
                  required
                  value={formData.route.destination}
                  onChange={(e) => setFormData({ ...formData, route: { ...formData.route, destination: e.target.value } })}
                  className="w-full px-4 py-3 bg-[#151d30] border border-[#1e2a45] rounded text-white placeholder-[#4a5568] focus:outline-none focus:border-[#3b82f6]"
                  placeholder="e.g., London, UK"
                />
              </div>
            </div>

            <div>
              <label className="block text-white mb-2">Waypoints (Optional)</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={waypointInput}
                  onChange={(e) => setWaypointInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addWaypoint())}
                  className="flex-1 px-4 py-3 bg-[#151d30] border border-[#1e2a45] rounded text-white placeholder-[#4a5568] focus:outline-none focus:border-[#3b82f6]"
                  placeholder="Add waypoint"
                />
                <button
                  type="button"
                  onClick={addWaypoint}
                  className="px-4 py-3 bg-[#3b82f6] text-white rounded hover:bg-[#2563eb] transition-colors"
                >
                  Add
                </button>
              </div>
              {formData.route.waypoints.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.route.waypoints.map((waypoint, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[#151d30] border border-[#1e2a45] rounded text-white flex items-center gap-2"
                    >
                      {waypoint}
                      <button
                        type="button"
                        onClick={() => removeWaypoint(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Goods Information */}
          <div className="space-y-4">
            <h2 className="text-white text-lg font-semibold border-b border-[#1e2a45] pb-2">Goods Information</h2>
            
            <div>
              <label htmlFor="serial_numbers" className="block text-white mb-2">
                Serial Numbers *
              </label>
              {formData.serial_numbers.map((sn, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    required={index === 0}
                    value={sn}
                    onChange={(e) => updateSerialNumber(index, e.target.value)}
                    className="flex-1 px-4 py-3 bg-[#151d30] border border-[#1e2a45] rounded text-white placeholder-[#4a5568] focus:outline-none focus:border-[#3b82f6]"
                    placeholder={`Serial number ${index + 1}`}
                  />
                  {formData.serial_numbers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSerialNumber(index)}
                      className="px-4 py-3 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addSerialNumber}
                className="px-4 py-2 bg-[#1e2a45] text-white rounded hover:bg-[#2a3654] transition-colors"
              >
                + Add Serial Number
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="container_number" className="block text-white mb-2">
                  Container Number *
                </label>
                <input
                  id="container_number"
                  type="text"
                  required
                  value={formData.container_number}
                  onChange={(e) => setFormData({ ...formData, container_number: e.target.value })}
                  className="w-full px-4 py-3 bg-[#151d30] border border-[#1e2a45] rounded text-white placeholder-[#4a5568] focus:outline-none focus:border-[#3b82f6]"
                  placeholder="CONT-12345"
                />
              </div>

              <div>
                <label htmlFor="goods_type" className="block text-white mb-2">
                  Goods Type *
                </label>
                <input
                  id="goods_type"
                  type="text"
                  required
                  value={formData.goods_type}
                  onChange={(e) => setFormData({ ...formData, goods_type: e.target.value })}
                  className="w-full px-4 py-3 bg-[#151d30] border border-[#1e2a45] rounded text-white placeholder-[#4a5568] focus:outline-none focus:border-[#3b82f6]"
                  placeholder="e.g., Electronics"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="delivery_number" className="block text-white mb-2">
                  Delivery Number *
                </label>
                <input
                  id="delivery_number"
                  type="text"
                  required
                  value={formData.delivery_number}
                  onChange={(e) => setFormData({ ...formData, delivery_number: e.target.value })}
                  className="w-full px-4 py-3 bg-[#151d30] border border-[#1e2a45] rounded text-white placeholder-[#4a5568] focus:outline-none focus:border-[#3b82f6]"
                  placeholder="DEL-12345"
                />
              </div>

              <div>
                <label htmlFor="batch_id" className="block text-white mb-2">
                  Batch ID *
                </label>
                <input
                  id="batch_id"
                  type="text"
                  required
                  value={formData.batch_id}
                  onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                  className="w-full px-4 py-3 bg-[#151d30] border border-[#1e2a45] rounded text-white placeholder-[#4a5568] focus:outline-none focus:border-[#3b82f6]"
                  placeholder="BATCH-12345"
                />
              </div>
            </div>

            <div>
              <label htmlFor="expected_delivery_date" className="block text-white mb-2">
                Expected Delivery Date *
              </label>
              <input
                id="expected_delivery_date"
                type="date"
                required
                value={formData.expected_delivery_date}
                onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                className="w-full px-4 py-3 bg-[#151d30] border border-[#1e2a45] rounded text-white focus:outline-none focus:border-[#3b82f6]"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-white mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-[#151d30] border border-[#1e2a45] rounded text-white placeholder-[#4a5568] focus:outline-none focus:border-[#3b82f6]"
                placeholder="Additional shipment details"
                rows={3}
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-white mb-2">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-3 bg-[#151d30] border border-[#1e2a45] rounded text-white focus:outline-none focus:border-[#3b82f6]"
              >
                <option value="pending">Pending</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded bg-red-500/20 border border-red-500 text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-[#3b82f6] text-white rounded hover:bg-[#2563eb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Shipment'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-3 bg-[#1e2a45] text-white rounded hover:bg-[#2a3654] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
