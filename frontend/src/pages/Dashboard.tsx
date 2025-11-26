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
  };
  status: string;
  created_at: string;
  goods_type?: string;
}

interface Statistics {
  totalShipments: number;
  totalDeviceData: number;
  pendingShipments: number;
  inTransitShipments: number;
  deliveredShipments: number;
  cancelledShipments: number;
  uniqueDevices: number;
}

export function Dashboard() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    totalShipments: 0,
    totalDeviceData: 0,
    pendingShipments: 0,
    inTransitShipments: 0,
    deliveredShipments: 0,
    cancelledShipments: 0,
    uniqueDevices: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [shipmentsData, deviceDataResponse] = await Promise.all([
        shipmentApi.getAll(),
        deviceApi.getAll(1, 1), // Just get count
      ]);
      
      setShipments(shipmentsData);
      
      // Calculate statistics
      const stats: Statistics = {
        totalShipments: shipmentsData.length,
        totalDeviceData: deviceDataResponse.total,
        pendingShipments: shipmentsData.filter(s => s.status === 'pending').length,
        inTransitShipments: shipmentsData.filter(s => s.status === 'in_transit').length,
        deliveredShipments: shipmentsData.filter(s => s.status === 'delivered').length,
        cancelledShipments: shipmentsData.filter(s => s.status === 'cancelled').length,
        uniqueDevices: new Set(shipmentsData.map(s => s.device_id)).size,
      };
      
      setStatistics(stats);
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
            <p className="text-[#8b92a7]">Overview of your shipments and device data</p>
          </div>
          <div className="flex gap-4">
            <Link
              to="/device-data"
              className="px-6 py-2 bg-[#1e2a45] text-white rounded hover:bg-[#2a3654] transition-colors"
            >
              View Device Data
            </Link>
            <Link
              to="/create-shipment"
              className="px-6 py-2 bg-[#3b82f6] text-white rounded hover:bg-[#2563eb] transition-colors"
            >
              Create Shipment
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[#3b82f6] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[#8b92a7] mt-4">Loading dashboard...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/20 border border-red-500 rounded text-red-400">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#0f1729] border border-[#1e2a45] rounded p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[#8b92a7] text-sm">Total Shipments</p>
                  <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <p className="text-white text-2xl font-bold">{statistics.totalShipments}</p>
              </div>

              <div className="bg-[#0f1729] border border-[#1e2a45] rounded p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[#8b92a7] text-sm">Device Data Points</p>
                  <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-white text-2xl font-bold">{statistics.totalDeviceData}</p>
              </div>

              <div className="bg-[#0f1729] border border-[#1e2a45] rounded p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[#8b92a7] text-sm">Active Devices</p>
                  <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-white text-2xl font-bold">{statistics.uniqueDevices}</p>
              </div>

              <div className="bg-[#0f1729] border border-[#1e2a45] rounded p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[#8b92a7] text-sm">In Transit</p>
                  <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <p className="text-white text-2xl font-bold">{statistics.inTransitShipments}</p>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-[#0f1729] border border-[#1e2a45] rounded p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[#8b92a7] text-sm">Pending</p>
                  <span className="px-2 py-1 rounded text-xs text-yellow-400 bg-yellow-400/10">
                    {statistics.pendingShipments}
                  </span>
                </div>
                <div className="w-full bg-[#151d30] rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{
                      width: `${statistics.totalShipments > 0 ? (statistics.pendingShipments / statistics.totalShipments) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="bg-[#0f1729] border border-[#1e2a45] rounded p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[#8b92a7] text-sm">In Transit</p>
                  <span className="px-2 py-1 rounded text-xs text-blue-400 bg-blue-400/10">
                    {statistics.inTransitShipments}
                  </span>
                </div>
                <div className="w-full bg-[#151d30] rounded-full h-2">
                  <div
                    className="bg-blue-400 h-2 rounded-full"
                    style={{
                      width: `${statistics.totalShipments > 0 ? (statistics.inTransitShipments / statistics.totalShipments) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="bg-[#0f1729] border border-[#1e2a45] rounded p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[#8b92a7] text-sm">Delivered</p>
                  <span className="px-2 py-1 rounded text-xs text-green-400 bg-green-400/10">
                    {statistics.deliveredShipments}
                  </span>
                </div>
                <div className="w-full bg-[#151d30] rounded-full h-2">
                  <div
                    className="bg-green-400 h-2 rounded-full"
                    style={{
                      width: `${statistics.totalShipments > 0 ? (statistics.deliveredShipments / statistics.totalShipments) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="bg-[#0f1729] border border-[#1e2a45] rounded p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[#8b92a7] text-sm">Cancelled</p>
                  <span className="px-2 py-1 rounded text-xs text-red-400 bg-red-400/10">
                    {statistics.cancelledShipments}
                  </span>
                </div>
                <div className="w-full bg-[#151d30] rounded-full h-2">
                  <div
                    className="bg-red-400 h-2 rounded-full"
                    style={{
                      width: `${statistics.totalShipments > 0 ? (statistics.cancelledShipments / statistics.totalShipments) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Recent Shipments */}
            <div className="bg-[#0f1729] border border-[#1e2a45] rounded overflow-hidden">
              <div className="px-6 py-4 border-b border-[#1e2a45] flex items-center justify-between">
                <h2 className="text-white text-lg font-semibold">Recent Shipments</h2>
                <Link
                  to="/create-shipment"
                  className="text-[#3b82f6] hover:text-[#2563eb] text-sm"
                >
                  View All →
                </Link>
              </div>
              
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
                        <th className="px-6 py-4 text-left text-[#8b92a7]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2a45]">
                      {shipments.slice(0, 5).map((shipment) => (
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
          </div>
        )}
      </div>
    </div>
  );
}
