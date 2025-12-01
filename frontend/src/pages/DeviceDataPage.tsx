import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { deviceApi, shipmentApi } from '../utils/api';

interface DeviceDataPoint {
  _id: string;
  Device_ID: number;
  Battery_Level: number;
  First_Sensor_temperature: number;
  Route_From: string;
  Route_To: string;
  timestamp?: string;
}

interface Shipment {
  _id: string;
  shipment_number: string;
  device_id: string;
  route: {
    origin: string;
    destination: string;
  };
  po_number: string;
  ndc_number: string;
  container_number: string;
  goods_type: string;
  status: string;
  created_at: string;
  [key: string]: any;
}

interface PaginatedResponse {
  data: DeviceDataPoint[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export function DeviceDataPage() {
  const navigate = useNavigate();
  const [deviceData, setDeviceData] = useState<DeviceDataPoint[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterDeviceId, setFilterDeviceId] = useState('');
  const [showAllDevices, setShowAllDevices] = useState(true);
  const [loadingShipments, setLoadingShipments] = useState(false);

  useEffect(() => {
    fetchAllDeviceData();
  }, []);

  useEffect(() => {
    if (showAllDevices) {
      fetchAllDeviceData();
      setShipments([]);
    } else if (filterDeviceId) {
      fetchDeviceData(filterDeviceId);
      fetchShipmentsByDeviceId(filterDeviceId);
    }
  }, [page, filterDeviceId, showAllDevices]);

  const fetchDeviceData = async (deviceId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response: PaginatedResponse = await deviceApi.getDeviceData(deviceId, page, limit);
      setDeviceData(response.data);
      setTotalPages(response.total_pages);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch device data');
      setDeviceData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchShipmentsByDeviceId = async (deviceId: string) => {
    try {
      setLoadingShipments(true);
      const shipmentData = await shipmentApi.getByDeviceId(deviceId);
      setShipments(shipmentData);
    } catch (err) {
      console.error('Failed to fetch shipments:', err);
      setShipments([]);
    } finally {
      setLoadingShipments(false);
    }
  };

  const fetchAllDeviceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: PaginatedResponse = await deviceApi.getAll(page, limit);
      setDeviceData(response.data);
      setTotalPages(response.total_pages);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch device data');
      setDeviceData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    if (filterDeviceId.trim()) {
      setShowAllDevices(false);
      setPage(1);
      fetchDeviceData(filterDeviceId.trim());
      fetchShipmentsByDeviceId(filterDeviceId.trim());
    }
  };

  const handleShowAll = () => {
    setShowAllDevices(true);
    setFilterDeviceId('');
    setPage(1);
    setShipments([]);
    fetchAllDeviceData();
  };

  return (
    <div className="min-h-screen bg-[#19254a]">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-white text-2xl font-bold mb-2">Device Data</h1>
          <p className="text-[#8b92a7]">View and filter real-time device telemetry data</p>
        </div>

        {/* Filter Section - Always Visible */}
        <div className="bg-[#0f1729] border border-[#1e2a45] rounded p-6 mb-6">
          <h2 className="text-white text-lg font-semibold mb-4">Filter by Device ID</h2>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="device_filter" className="block text-white mb-2 text-sm">
                Enter Device ID to filter (e.g., 1150, 1151, 1152...)
              </label>
              <input
                id="device_filter"
                type="text"
                value={filterDeviceId}
                onChange={(e) => setFilterDeviceId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
                placeholder="Enter device ID (e.g., 1150)"
                className="w-full px-4 py-3 bg-[#151d30] border border-[#1e2a45] rounded text-white placeholder-[#4a5568] focus:outline-none focus:border-[#3b82f6]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleFilter}
                disabled={!filterDeviceId.trim()}
                className="px-6 py-3 bg-[#3b82f6] text-white rounded hover:bg-[#2563eb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Filter
              </button>
              {!showAllDevices && (
                <button
                  onClick={handleShowAll}
                  className="px-6 py-3 bg-[#1e2a45] text-white rounded hover:bg-[#2a3654] transition-colors"
                >
                  Show All
                </button>
              )}
            </div>
          </div>
          {!showAllDevices && filterDeviceId && (
            <div className="mt-4 p-3 bg-[#151d30] rounded">
              <p className="text-[#8b92a7] text-sm">
                Currently showing data for Device ID: <span className="text-white font-semibold">{filterDeviceId}</span>
                {shipments.length > 0 && (
                  <span className="ml-2 text-[#3b82f6]">
                    • {shipments.length} shipment{shipments.length !== 1 ? 's' : ''} found
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Shipments Section - Only shown when filtering by device ID */}
        {!showAllDevices && filterDeviceId && (
          <div className="bg-[#0f1729] border border-[#1e2a45] rounded overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-[#1e2a45]">
              <h2 className="text-white text-lg font-semibold">Shipments for Device {filterDeviceId}</h2>
            </div>
            {loadingShipments ? (
              <div className="text-center py-8">
                <div className="inline-block w-6 h-6 border-4 border-[#3b82f6] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[#8b92a7] mt-2 text-sm">Loading shipments...</p>
              </div>
            ) : shipments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#8b92a7]">No shipments found for this device ID.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#151d30]">
                    <tr>
                      <th className="px-6 py-4 text-left text-[#8b92a7]">Shipment Number</th>
                      <th className="px-6 py-4 text-left text-[#8b92a7]">PO Number</th>
                      <th className="px-6 py-4 text-left text-[#8b92a7]">Route</th>
                      <th className="px-6 py-4 text-left text-[#8b92a7]">Goods Type</th>
                      <th className="px-6 py-4 text-left text-[#8b92a7]">Status</th>
                      <th className="px-6 py-4 text-left text-[#8b92a7]">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2a45]">
                    {shipments.map((shipment) => (
                      <tr key={shipment._id} className="hover:bg-[#151d30] transition-colors">
                        <td className="px-6 py-4 text-white">{shipment.shipment_number}</td>
                        <td className="px-6 py-4 text-[#8b92a7]">{shipment.po_number}</td>
                        <td className="px-6 py-4 text-[#8b92a7]">
                          {shipment.route?.origin} → {shipment.route?.destination}
                        </td>
                        <td className="px-6 py-4 text-[#8b92a7]">{shipment.goods_type}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            shipment.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                            shipment.status === 'in_transit' ? 'bg-blue-500/20 text-blue-400' :
                            shipment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            shipment.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {shipment.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#8b92a7]">
                          {new Date(shipment.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[#3b82f6] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[#8b92a7] mt-4">Loading device data...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/20 border border-red-500 rounded text-red-400">
            {error}
          </div>
        ) : (
          <div className="bg-[#0f1729] border border-[#1e2a45] rounded overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1e2a45] flex items-center justify-between">
              <h2 className="text-white text-lg font-semibold">
                {showAllDevices ? 'All Device Data' : `Device ${filterDeviceId} Data`}
              </h2>
              <p className="text-[#8b92a7] text-sm">
                Showing {deviceData.length} of {total} records
              </p>
            </div>
            
            {deviceData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#8b92a7]">No device data available.</p>
                {!showAllDevices && (
                  <p className="text-[#8b92a7] mt-2">Try a different device ID or click "Show All" to view all devices.</p>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#151d30]">
                      <tr>
                        <th className="px-6 py-4 text-left text-[#8b92a7]">Device ID</th>
                        <th className="px-6 py-4 text-left text-[#8b92a7]">Battery Level</th>
                        <th className="px-6 py-4 text-left text-[#8b92a7]">Temperature</th>
                        <th className="px-6 py-4 text-left text-[#8b92a7]">Route From</th>
                        <th className="px-6 py-4 text-left text-[#8b92a7]">Route To</th>
                        {deviceData[0]?.timestamp && (
                          <th className="px-6 py-4 text-left text-[#8b92a7]">Timestamp</th>
                        )}
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
                          {data.timestamp && (
                            <td className="px-6 py-4 text-[#8b92a7]">
                              {new Date(data.timestamp).toLocaleString()}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-[#1e2a45] flex items-center justify-between">
                    <div className="text-[#8b92a7] text-sm">
                      Page {page} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-[#1e2a45] text-white rounded hover:bg-[#2a3654] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 bg-[#1e2a45] text-white rounded hover:bg-[#2a3654] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

