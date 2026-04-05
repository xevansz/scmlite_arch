import React, { useEffect, useState } from "react";
import { Navigation } from "../components/Navigation";
import { adminApi } from "../utils/api";

interface User {
  _id: string;
  email: string;
  full_name: string;
  created_at: string;
}

interface DeviceHealth {
  time_window_minutes: number;
  expected_devices: number[];
  active_devices: number[];
  missing_devices: number[];
  total_recent_data_points: number;
  health_status: string;
}

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [deviceHealth, setDeviceHealth] = useState<DeviceHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, healthData] = await Promise.all([
        adminApi.getAllUsers(),
        adminApi.getDeviceHealth(),
      ]);
      setUsers(usersData);
      setDeviceHealth(healthData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch admin data",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      setDeleteLoading(userId);
      await adminApi.deleteUser(userId);
      setUsers(users.filter((u) => u._id !== userId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navigation />

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-[var(--color-text)] text-2xl font-bold mb-2">
            Admin Dashboard
          </h1>
          <p className="text-[var(--color-text-muted)]">
            Manage users and monitor system health
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[var(--color-text-muted)] mt-4">
              Loading admin data...
            </p>
          </div>
        ) : error ? (
          <div className="p-4 bg-[var(--color-error)]/20 border border-[var(--color-error)] rounded text-[var(--color-error)]">
            {error}
          </div>
        ) : (
          <div className="space-y-8">
            {/* System Health */}
            {deviceHealth && (
              <div className="bg-[var(--color-surface)] border border-[var(--color-secondary)] rounded p-6">
                <h2 className="text-[var(--color-text)] text-lg font-semibold mb-4">
                  System Health Check
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-[var(--color-background)] p-4 rounded">
                    <p className="text-[var(--color-text-muted)] text-sm mb-1">
                      Status
                    </p>
                    <p
                      className={`text-lg font-semibold ${
                        deviceHealth.health_status === "healthy"
                          ? "text-[var(--color-success)]"
                          : "text-[var(--color-warning)]"
                      }`}
                    >
                      {deviceHealth.health_status.toUpperCase()}
                    </p>
                  </div>
                  <div className="bg-[var(--color-background)] p-4 rounded">
                    <p className="text-[var(--color-text-muted)] text-sm mb-1">
                      Active Devices
                    </p>
                    <p className="text-[var(--color-text)] text-lg font-semibold">
                      {deviceHealth.active_devices.length} /{" "}
                      {deviceHealth.expected_devices.length}
                    </p>
                  </div>
                  <div className="bg-[var(--color-background)] p-4 rounded">
                    <p className="text-[var(--color-text-muted)] text-sm mb-1">
                      Recent Data Points
                    </p>
                    <p className="text-[var(--color-text)] text-lg font-semibold">
                      {deviceHealth.total_recent_data_points}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[var(--color-background)] p-4 rounded">
                    <p className="text-[var(--color-text-muted)] text-sm mb-2">
                      Active Devices (Last {deviceHealth.time_window_minutes}{" "}
                      min)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {deviceHealth.active_devices.length > 0 ? (
                        deviceHealth.active_devices.map((id) => (
                          <span
                            key={id}
                            className="px-2 py-1 bg-[var(--color-success)]/10 text-[var(--color-success)] rounded text-sm"
                          >
                            {id}
                          </span>
                        ))
                      ) : (
                        <span className="text-[var(--color-text-muted)] text-sm">
                          No active devices
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-[var(--color-background)] p-4 rounded">
                    <p className="text-[var(--color-text-muted)] text-sm mb-2">
                      Missing Devices
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {deviceHealth.missing_devices.length > 0 ? (
                        deviceHealth.missing_devices.map((id) => (
                          <span
                            key={id}
                            className="px-2 py-1 bg-[var(--color-error)]/10 text-[var(--color-error)] rounded text-sm"
                          >
                            {id}
                          </span>
                        ))
                      ) : (
                        <span className="text-[var(--color-success)] text-sm">
                          All devices active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User Management */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-secondary)] rounded overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--color-secondary)]">
                <h2 className="text-[var(--color-text)] text-lg font-semibold">
                  User Management
                </h2>
                <p className="text-[var(--color-text-muted)] text-sm mt-1">
                  Total users: {users.length}
                </p>
              </div>

              {users.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[var(--color-text-muted)]">
                    No users found
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--color-background)] border-b border-[var(--color-secondary)]">
                      <tr>
                        <th className="px-6 py-4 text-left text-[var(--color-text-muted)]">
                          Email
                        </th>
                        <th className="px-6 py-4 text-left text-[var(--color-text-muted)]">
                          Full Name
                        </th>
                        <th className="px-6 py-4 text-left text-[var(--color-text-muted)]">
                          Created At
                        </th>
                        <th className="px-6 py-4 text-left text-[var(--color-text-muted)]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-secondary)]">
                      {users.map((user) => (
                        <tr
                          key={user._id}
                          className="hover:bg-[var(--color-background)] transition-colors"
                        >
                          <td className="px-6 py-4 text-[var(--color-text)]">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 text-[var(--color-text)]">
                            {user.full_name}
                          </td>
                          <td className="px-6 py-4 text-[var(--color-text-muted)] text-sm">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              disabled={deleteLoading === user._id}
                              className="px-3 py-1 bg-[var(--color-error)] text-[var(--color-text)] rounded hover:bg-[var(--color-error)]/80 transition-colors disabled:opacity-50 text-sm"
                            >
                              {deleteLoading === user._id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
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
