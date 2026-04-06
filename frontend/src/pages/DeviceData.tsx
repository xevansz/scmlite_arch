import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "../components/Navigation";
import { deviceApi } from "../utils/api";

interface DeviceDataPoint {
  _id: string;
  Device_ID: number;
  Battery_Level: number;
  First_Sensor_temperature: number;
  Route_From: string;
  Route_To: string;
  timestamp?: string;
}

interface PaginatedResponse {
  data: DeviceDataPoint[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export function DeviceData() {
  const { device_id } = useParams<{ device_id: string }>();
  const navigate = useNavigate();
  const [deviceData, setDeviceData] = useState<DeviceDataPoint[]>([]);
  const [latestData, setLatestData] = useState<DeviceDataPoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterDeviceId, setFilterDeviceId] = useState(device_id || "");
  const [showAllDevices, setShowAllDevices] = useState(!device_id);

  useEffect(() => {
    if (device_id) {
      setFilterDeviceId(device_id);
      setShowAllDevices(false);
      fetchDeviceData(device_id);
    } else {
      fetchAllDeviceData();
    }
    fetchLatestData();
  }, [device_id]);

  useEffect(() => {
    if (showAllDevices) {
      fetchAllDeviceData();
    } else if (filterDeviceId) {
      fetchDeviceData(filterDeviceId);
    }
  }, [page, filterDeviceId, showAllDevices]);

  const fetchDeviceData = async (deviceId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response: PaginatedResponse = await deviceApi.getDeviceData(
        deviceId,
        page,
        limit,
      );
      setDeviceData(response.data);
      setTotalPages(response.total_pages);
      setTotal(response.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch device data",
      );
      setDeviceData([]);
    } finally {
      setLoading(false);
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
      setError(
        err instanceof Error ? err.message : "Failed to fetch device data",
      );
      setDeviceData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestData = async () => {
    try {
      const latest = await deviceApi.getLatestData();
      if (latest) {
        setLatestData(latest);
      }
    } catch (err) {
      // Silently fail for latest data
      console.error("Failed to fetch latest data:", err);
    }
  };

  const handleFilter = () => {
    if (filterDeviceId.trim()) {
      setShowAllDevices(false);
      setPage(1);
      // Update the URL with the new device ID
      navigate(`?device_id=${filterDeviceId.trim()}`, { replace: true });
      fetchDeviceData(filterDeviceId.trim());
    }
  };

  const handleShowAll = () => {
    setShowAllDevices(true);
    setFilterDeviceId("");
    setPage(1);
    navigate("?", { replace: true });
    fetchAllDeviceData();
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navigation />

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-[var(--color-text)] text-2xl font-bold mb-2">
            Device Data
          </h1>
          <p className="text-[var(--color-text-muted)]">
            {device_id
              ? `Real-time telemetry data for device: ${device_id}`
              : "View and filter device telemetry data from all devices"}
          </p>
        </div>

        {/* Filter Section */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-secondary)] rounded p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label
                htmlFor="device_filter"
                className="block text-[var(--color-text)] mb-2"
              >
                Filter by Device ID
              </label>
              <div className="flex gap-2">
                <input
                  id="device_filter"
                  type="text"
                  value={filterDeviceId}
                  onChange={(e) => setFilterDeviceId(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleFilter()}
                  placeholder="Enter device ID (e.g., 1150)"
                  className="flex-1 px-4 py-3 bg-[var(--color-background)] border border-[var(--color-secondary)] rounded text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                />
                <button
                  onClick={handleFilter}
                  disabled={!filterDeviceId.trim()}
                  className="px-6 py-3 bg-[var(--color-primary)] text-[var(--color-background)] rounded hover:bg-[var(--color-accent)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Filter
                </button>
                {!showAllDevices && (
                  <button
                    onClick={handleShowAll}
                    className="px-6 py-3 bg-[var(--color-secondary)] text-[var(--color-text)] rounded hover:bg-[var(--color-accent)] transition-colors"
                  >
                    Show All
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[var(--color-text-muted)] mt-4">
              Loading device data...
            </p>
          </div>
        ) : error ? (
          <div className="p-4 bg-[var(--color-error)]/20 border border-[var(--color-error)] rounded text-[var(--color-error)]">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Latest Data Card */}
            {latestData && !showAllDevices && (
              <div className="bg-[var(--color-surface)] border border-[var(--color-secondary)] rounded p-6">
                <h2 className="text-[var(--color-text)] text-lg font-semibold mb-4">
                  Latest Reading
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-[var(--color-background)] p-4 rounded">
                    <p className="text-[var(--color-text-muted)] mb-1 text-sm">
                      Device ID
                    </p>
                    <p className="text-[var(--color-text)] text-lg font-semibold">
                      {latestData.Device_ID}
                    </p>
                  </div>
                  <div className="bg-[var(--color-background)] p-4 rounded">
                    <p className="text-[var(--color-text-muted)] mb-1 text-sm">
                      Battery Level
                    </p>
                    <p className="text-[var(--color-text)] text-lg font-semibold">
                      {latestData.Battery_Level}V
                    </p>
                  </div>
                  <div className="bg-[var(--color-background)] p-4 rounded">
                    <p className="text-[var(--color-text-muted)] mb-1 text-sm">
                      Temperature
                    </p>
                    <p className="text-[var(--color-text)] text-lg font-semibold">
                      {latestData.First_Sensor_temperature}°C
                    </p>
                  </div>
                  <div className="bg-[var(--color-background)] p-4 rounded">
                    <p className="text-[var(--color-text-muted)] mb-1 text-sm">
                      Route From
                    </p>
                    <p className="text-[var(--color-text)] text-sm">
                      {latestData.Route_From}
                    </p>
                  </div>
                  <div className="bg-[var(--color-background)] p-4 rounded">
                    <p className="text-[var(--color-text-muted)] mb-1 text-sm">
                      Route To
                    </p>
                    <p className="text-[var(--color-text)] text-sm">
                      {latestData.Route_To}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Device Data Table */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-secondary)] rounded overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--color-secondary)] flex items-center justify-between">
                <h2 className="text-[var(--color-text)] text-lg font-semibold">
                  {showAllDevices
                    ? "All Device Data"
                    : `Device ${filterDeviceId} Data`}
                </h2>
                <p className="text-[var(--color-text-muted)] text-sm">
                  Showing {deviceData.length} of {total} records
                </p>
              </div>

              {deviceData.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[var(--color-text-muted)]">
                    No device data available.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[var(--color-background)]">
                        <tr>
                          <th className="px-6 py-4 text-left text-[var(--color-text-muted)]">
                            Device ID
                          </th>
                          <th className="px-6 py-4 text-left text-[var(--color-text-muted)]">
                            Battery Level
                          </th>
                          <th className="px-6 py-4 text-left text-[var(--color-text-muted)]">
                            Temperature
                          </th>
                          <th className="px-6 py-4 text-left text-[var(--color-text-muted)]">
                            Route From
                          </th>
                          <th className="px-6 py-4 text-left text-[var(--color-text-muted)]">
                            Route To
                          </th>
                          {deviceData[0]?.timestamp && (
                            <th className="px-6 py-4 text-left text-[var(--color-text-muted)]">
                              Timestamp
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-secondary)]">
                        {deviceData.map((data) => (
                          <tr
                            key={data._id}
                            className="hover:bg-[var(--color-background)] transition-colors"
                          >
                            <td className="px-6 py-4 text-[var(--color-text)]">
                              {data.Device_ID}
                            </td>
                            <td className="px-6 py-4 text-[var(--color-text-muted)]">
                              {data.Battery_Level}V
                            </td>
                            <td className="px-6 py-4 text-[var(--color-text-muted)]">
                              {data.First_Sensor_temperature}°C
                            </td>
                            <td className="px-6 py-4 text-[var(--color-text-muted)]">
                              {data.Route_From}
                            </td>
                            <td className="px-6 py-4 text-[var(--color-text-muted)]">
                              {data.Route_To}
                            </td>
                            {data.timestamp && (
                              <td className="px-6 py-4 text-[var(--color-text-muted)]">
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
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="px-4 py-2 bg-[#1e2a45] text-white rounded hover:bg-[#2a3654] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
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
          </div>
        )}
      </div>
    </div>
  );
}
