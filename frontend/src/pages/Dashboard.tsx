import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navigation } from "../components/Navigation";
import { shipmentApi, deviceApi } from "../utils/api";

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

interface DeviceDataPoint {
  _id: string;
  Device_ID: number;
  Battery_Level: number;
  First_Sensor_temperature: number;
  Route_From: string;
  Route_To: string;
  timestamp?: string;
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

const formatTimeSince = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Convert to appropriate time unit
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
};

export function Dashboard() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [latestData, setLatestData] = useState<DeviceDataPoint | null>(null);
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
    fetchLatestData();
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
        pendingShipments: shipmentsData.filter((s) => s.status === "pending")
          .length,
        inTransitShipments: shipmentsData.filter(
          (s) => s.status === "in_transit",
        ).length,
        deliveredShipments: shipmentsData.filter(
          (s) => s.status === "delivered",
        ).length,
        cancelledShipments: shipmentsData.filter(
          (s) => s.status === "cancelled",
        ).length,
        uniqueDevices: new Set(shipmentsData.map((s) => s.device_id)).size,
      };

      setStatistics(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
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

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("delivered")) {
      return "text-[var(--color-success)] bg-[var(--color-success)]/10";
    }
    if (statusLower.includes("in_transit") || statusLower.includes("transit")) {
      return "text-[var(--color-accent)] bg-[var(--color-accent)]/10";
    }
    if (statusLower.includes("pending")) {
      return "text-[var(--color-warning)] bg-[var(--color-warning)]/10";
    }
    if (statusLower.includes("cancelled")) {
      return "text-[var(--color-error)] bg-[var(--color-error)]/10";
    }
    return "text-[var(--color-text-muted)] bg-[var(--color-text-muted)]/10";
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navigation />

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[var(--color-text)] text-2xl font-bold mb-2">
              Dashboard
            </h1>
            <p className="text-[var(--color-text-muted)]">
              Overview of your shipments and device data
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              to="/device-data"
              className="px-6 py-2 bg-[var(--color-secondary)] text-[var(--color-text)] rounded hover:bg-[var(--color-accent)] transition-colors"
            >
              View Device Data
            </Link>
            <Link
              to="/create-shipment"
              className="px-6 py-2 bg-[var(--color-primary)] text-[var(--color-background)] rounded hover:bg-[var(--color-accent)] transition-colors font-medium"
            >
              Create Shipment
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[var(--color-text-muted)] mt-4">
              Loading dashboard...
            </p>
          </div>
        ) : error ? (
          <div className="p-4 bg-[var(--color-error)]/20 border border-[var(--color-error)] rounded text-[var(--color-error)]">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[var(--color-surface)] border border-[var(--color-secondary)] rounded p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[var(--color-text-muted)] text-sm">
                    Total Shipments
                  </p>
                  <div className="w-10 h-10 bg-[var(--color-accent)]/10 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-[var(--color-accent)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-[var(--color-text)] text-2xl font-bold">
                  {statistics.totalShipments}
                </p>
              </div>

              <div className="bg-[var(--color-surface)] border border-[var(--color-secondary)] rounded p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[var(--color-text-muted)] text-sm">
                    Device Data Points
                  </p>
                  <div className="w-10 h-10 bg-[var(--color-success)]/10 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-[var(--color-success)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-[var(--color-text)] text-2xl font-bold">
                  {statistics.totalDeviceData}
                </p>
              </div>

              <div className="bg-[var(--color-surface)] border border-[var(--color-secondary)] rounded p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[var(--color-text-muted)] text-sm">
                    Active Devices
                  </p>
                  <div className="w-10 h-10 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-[var(--color-primary)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-[var(--color-text)] text-2xl font-bold">
                  {statistics.uniqueDevices}
                </p>
              </div>

              <div className="bg-[var(--color-surface)] border border-[var(--color-secondary)] rounded p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[var(--color-text-muted)] text-sm">
                    In Transit
                  </p>
                  <div className="w-10 h-10 bg-[var(--color-warning)]/10 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-[var(--color-warning)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-[var(--color-text)] text-2xl font-bold">
                  {statistics.inTransitShipments}
                </p>
              </div>
            </div>

            {/* Latest Reading Card */}
            {latestData && (
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

            {/* Status Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-[var(--color-surface)] border border-[var(--color-secondary)] rounded p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[var(--color-text-muted)] text-sm">
                    Pending
                  </p>
                  <span className="px-2 py-1 rounded text-xs text-[var(--color-warning)] bg-[var(--color-warning)]/10">
                    {statistics.pendingShipments}
                  </span>
                </div>
                <div className="w-full bg-[var(--color-background)] rounded-full h-2">
                  <div
                    className="bg-[var(--color-warning)] h-2 rounded-full"
                    style={{
                      width: `${statistics.totalShipments > 0 ? (statistics.pendingShipments / statistics.totalShipments) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="bg-[var(--color-surface)] border border-[var(--color-secondary)] rounded p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[var(--color-text-muted)] text-sm">
                    In Transit
                  </p>
                  <span className="px-2 py-1 rounded text-xs text-[var(--color-accent)] bg-[var(--color-accent)]/10">
                    {statistics.inTransitShipments}
                  </span>
                </div>
                <div className="w-full bg-[var(--color-background)] rounded-full h-2">
                  <div
                    className="bg-[var(--color-accent)] h-2 rounded-full"
                    style={{
                      width: `${statistics.totalShipments > 0 ? (statistics.inTransitShipments / statistics.totalShipments) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="bg-[var(--color-surface)] border border-[var(--color-secondary)] rounded p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[var(--color-text-muted)] text-sm">
                    Delivered
                  </p>
                  <span className="px-2 py-1 rounded text-xs text-[var(--color-success)] bg-[var(--color-success)]/10">
                    {statistics.deliveredShipments}
                  </span>
                </div>
                <div className="w-full bg-[var(--color-background)] rounded-full h-2">
                  <div
                    className="bg-[var(--color-success)] h-2 rounded-full"
                    style={{
                      width: `${statistics.totalShipments > 0 ? (statistics.deliveredShipments / statistics.totalShipments) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="bg-[var(--color-surface)] border border-[var(--color-secondary)] rounded p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[var(--color-text-muted)] text-sm">
                    Cancelled
                  </p>
                  <span className="px-2 py-1 rounded text-xs text-[var(--color-error)] bg-[var(--color-error)]/10">
                    {statistics.cancelledShipments}
                  </span>
                </div>
                <div className="w-full bg-[var(--color-background)] rounded-full h-2">
                  <div
                    className="bg-[var(--color-error)] h-2 rounded-full"
                    style={{
                      width: `${statistics.totalShipments > 0 ? (statistics.cancelledShipments / statistics.totalShipments) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Recent Shipments */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-secondary)] rounded overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--color-secondary)] flex items-center justify-between">
                <h2 className="text-[var(--color-text)] text-lg font-semibold">
                  Recent Shipments
                </h2>
                <Link
                  to="/create-shipment"
                  className="text-[var(--color-accent)] hover:text-[var(--color-primary)] text-sm"
                >
                  View All →
                </Link>
              </div>

              {shipments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[var(--color-text-muted)]">
                    No shipments found. Create your first shipment to get
                    started.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--color-background)] border-b border-[var(--color-secondary)]">
                      <tr>
                        <th className="px-6 py-4 text-left text-[var(--color-text-muted)]">
                          Shipment Number
                        </th>
                        <th className="px-6 py-4 text-left text-[var(--color-text-muted)]">
                          Device ID
                        </th>
                        <th className="px-6 py-4 text-left text-[var(--color-text-muted)]">
                          Route
                        </th>
                        <th className="px-6 py-4 text-left text-[var(--color-text-muted)]">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-[var(--color-text-muted)]">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-secondary)]">
                      {shipments.slice(0, 5).map((shipment) => (
                        <tr
                          key={shipment._id}
                          className="hover:bg-[var(--color-background)] transition-colors"
                        >
                          <td className="px-6 py-4 text-[var(--color-text)]">
                            {shipment.shipment_number}
                          </td>
                          <td className="px-6 py-4 text-[var(--color-text)]">
                            {shipment.device_id}
                          </td>
                          <td className="px-6 py-4 text-[var(--color-text-muted)]">
                            {shipment.route.origin} →{" "}
                            {shipment.route.destination}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded text-sm ${getStatusColor(shipment.status)}`}
                            >
                              {shipment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[var(--color-text-muted)] text-sm">
                            {formatTimeSince(shipment.created_at)}
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
