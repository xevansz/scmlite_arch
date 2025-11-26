import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { shipmentApi, deviceApi } from '../utils/api';

interface Shipment {
  _id: string;
  shipment_number: string;
  device_id: string;
  route: {
    origin: string;
    destination: string;
    waypoints?: string[];
  };
  status: string;
  created_at: string;
  created_by: string;
  po_number?: string;
  goods_type?: string;
}

interface DeviceData {
  _id: string;
  Device_ID: number;
  Battery_Level: number;
  First_Sensor_temperature: number;
  Route_From: string;
  Route_To: string;
  timestamp?: string;
}

export function Dashboard() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'shipments' | 'device-data'>('shipments');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [shipmentsData, deviceDataResponse] = await Promise.all([
        shipmentApi.getAll(),
        deviceApi.getAll(1, 20), // Get first 20 device data points
      ]);
      setShipments(shipmentsData);
      setDeviceData(deviceDataResponse.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('delivered')) {
      return 'text-green-400 bg-green-400/10';
    }
    if (statusLower.includes('in_transit') || statusLower.includes('transit')) {
      return 'text-blue-400 bg-blue-400/10';
    }
    if (statusLower.includes('pending')) {
      return 'text-yellow-400 bg-yellow-400/10';
    }
    if (statusLower.includes('cancelled')) {
      return 'text-red-400 bg-red-400/10';
    }
    return 'text-gray-400 bg-gray-400/10';
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white text-2xl font-bold mb-2">Dashboard</h1>
            <p className="text-[#8b92a7]">View and manage all your shipments and device data</p>
          </div>
          <Link
            to="/create-shipment"
            className="px-6 py-2 bg-[#3b82f6] text-white rounded hover:bg-[#2563eb] transition-colors"
          >
            Create Shipment
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-[#1e2a45]">
          <button
            onClick={() => setActiveTab('shipments')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'shipments'
                ? 'text-[#3b82f6] border-b-2 border-[#3b82f6]'
                : 'text-[#8b92a7] hover:text-white'
            }`}
          >
            Shipments ({shipments.length})
          </button>
          <button
            onClick={() => setActiveTab('device-data')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'device-data'
                ? 'text-[#3b82f6] border-b-2 border-[#3b82f6]'
                : 'text-[#8b92a7] hover:text-white'
            }`}
          >
            Device Data ({deviceData.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[#3b82f6] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[#8b92a7] mt-4">Loading data...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/20 border border-red-500 rounded text-red-400">
            {error}
          </div>
        ) : (
          <>
            {/* Shipments Tab */}
            {activeTab === 'shipments' && (
              <div className="bg-[#0f1729] border border-[#1e2a45] rounded overflow-hidden">
                {shipments.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[#8b92a7]">No shipments found. Create your first shipment to get started.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#151d30] border-b border-[#1e2a45]">
                        <tr>
                          <th className="px-6 py-4 text-left text-[#8b92a7]">Shipment Number</th>
                          <th className="px-6 py-4 text-left text-[#8b92a7]">Device ID</th>
                          <th className="px-6 py-4 text-left text-[#8b92a7]">Route</th>
                          <th className="px-6 py-4 text-left text-[#8b92a7]">Status</th>
                          <th className="px-6 py-4 text-left text-[#8b92a7]">Goods Type</th>
                          <th className="px-6 py-4 text-left text-[#8b92a7]">Created At</th>
                          <th className="px-6 py-4 text-left text-[#8b92a7]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e2a45]">
                        {shipments.map((shipment) => (
                          <tr key={shipment._id} className="hover:bg-[#151d30] transition-colors">
                            <td className="px-6 py-4 text-white">{shipment.shipment_number}</td>
                            <td className="px-6 py-4 text-white">{shipment.device_id}</td>
                            <td className="px-6 py-4 text-[#8b92a7]">
                              {shipment.route.origin} → {shipment.route.destination}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded text-sm ${getStatusColor(shipment.status)}`}>
                                {shipment.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-[#8b92a7]">{shipment.goods_type || 'N/A'}</td>
                            <td className="px-6 py-4 text-[#8b92a7]">
                              {new Date(shipment.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <Link
                                to={`/device-data/${shipment.device_id}`}
                                className="px-4 py-2 bg-[#3b82f6] text-white rounded hover:bg-[#2563eb] transition-colors inline-block text-sm"
                              >
                                View Data
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Device Data Tab */}
            {activeTab === 'device-data' && (
              <div className="bg-[#0f1729] border border-[#1e2a45] rounded overflow-hidden">
                {deviceData.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[#8b92a7]">No device data available.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#151d30] border-b border-[#1e2a45]">
                        <tr>
                          <th className="px-6 py-4 text-left text-[#8b92a7]">Device ID</th>
                          <th className="px-6 py-4 text-left text-[#8b92a7]">Battery Level</th>
                          <th className="px-6 py-4 text-left text-[#8b92a7]">Temperature</th>
                          <th className="px-6 py-4 text-left text-[#8b92a7]">Route From</th>
                          <th className="px-6 py-4 text-left text-[#8b92a7]">Route To</th>
                          <th className="px-6 py-4 text-left text-[#8b92a7]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e2a45]">
                        {deviceData.map((data) => (
                          <tr key={data._id} className="hover:bg-[#151d30] transition-colors">
                            <td className="px-6 py-4 text-white">{data.Device_ID}</td>
                            <td className="px-6 py-4 text-[#8b92a7]">{data.Battery_Level}V</td>
                            <td className="px-6 py-4 text-[#8b92a7]">{data.First_Sensor_temperature}°C</td>
                            <td className="px-6 py-4 text-[#8b92a7]">{data.Route_From}</td>
                            <td className="px-6 py-4 text-[#8b92a7]">{data.Route_To}</td>
                            <td className="px-6 py-4">
                              <Link
                                to={`/device-data/${data.Device_ID}`}
                                className="px-4 py-2 bg-[#3b82f6] text-white rounded hover:bg-[#2563eb] transition-colors inline-block text-sm"
                              >
                                View Details
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
