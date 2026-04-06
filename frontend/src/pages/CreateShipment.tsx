import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "../components/Navigation";
import { shipmentApi } from "../utils/api";

export function CreateShipment() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    device_id: "",
    device: "",
    route_details: "",
    po_number: "",
    ndc_number: "",
    serial_number: "",
    container_number: "",
    goods_type: "",
    expected_delivery_date: "",
    delivery_number: "",
    batch_id: "",
    description: "",
    status: "in_transit",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; details?: any } | null>(
    null,
  );

  // Route options for dropdown
  const routeOptions = [
    "New York, USA -> London, UK",
    "Los Angeles, USA -> Tokyo, Japan",
    "London, UK -> Mumbai, India",
    "Berlin, Germany -> Singapore",
    "Tokyo, Japan -> Sydney, Australia",
    "Mumbai, India -> New York, USA",
    "Singapore -> Berlin, Germany",
    "Sydney, Australia -> Los Angeles, USA",
  ];

  // Device options for dropdown
  const deviceOptions = [
    "GPS Tracker Pro",
    "IoT Sensor Device",
    "Temperature Monitor",
    "Humidity Sensor",
    "Multi-Sensor Device",
    "RFID Tracker",
  ];

  // Goods type options for dropdown
  const goodsTypeOptions = [
    "Electronics",
    "Pharmaceuticals",
    "Food & Beverages",
    "Textiles",
    "Automotive Parts",
    "Chemicals",
    "Machinery",
    "Raw Materials",
    "Other",
  ];

  // Status options for dropdown
  const statusOptions = [
    { value: "in_transit", label: "In Transit" },
    { value: "delivered", label: "Delivered" },
    { value: "pending", label: "Pending" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Parse route details to extract origin and destination
      if (!formData.route_details) {
        throw new Error("Please select a route");
      }

      const routeParts = formData.route_details.split(" -> ");
      if (routeParts.length !== 2) {
        throw new Error(
          'Invalid route format. Expected format: "Origin -> Destination"',
        );
      }

      const [origin, destination] = routeParts;

      // Generate shipment number (required by backend)
      const shipmentNumber = `SHIP-${Date.now()}`;

      // Prepare data matching backend model
      const shipmentData = {
        shipment_number: shipmentNumber,
        device_id: parseInt(formData.device_id, 10) || 0,
        route: {
          origin: origin.trim(),
          destination: destination.trim(),
        },
        po_number: formData.po_number,
        ndc_number: formData.ndc_number,
        serial_numbers: formData.serial_number ? [formData.serial_number] : [],
        container_number: formData.container_number,
        goods_type: formData.goods_type,
        expected_delivery_date: formData.expected_delivery_date,
        delivery_number: formData.delivery_number,
        batch_id: formData.batch_id,
        description: formData.description,
        status: formData.status,
      };

      // Client-side validation
      if (!shipmentData.device_id) {
        throw new Error("Please enter a valid shipment number");
      }
      if (!shipmentData.route.origin || !shipmentData.route.destination) {
        throw new Error("Please select a valid route");
      }

      try {
        await shipmentApi.create(shipmentData);
        navigate("/dashboard");
      } catch (apiError: any) {
        // This will be caught by the outer catch block
        throw apiError;
      }
    } catch (err: any) {
      if (err instanceof Error) {
        setError({
          message: err.message,
          details: "details" in err ? err.details : undefined,
        });
      } else {
        setError({
          message: "Failed to create shipment",
          details: String(err),
        });
      }
      console.error("Shipment creation error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navigation />

      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-[var(--color-text)] mb-2 text-2xl font-bold">
            Create Shipment
          </h1>
          <p className="text-[var(--color-text-muted)]">
            Create a new shipment with device tracking
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[var(--color-surface)] border border-[var(--color-secondary)] rounded p-8 space-y-6"
        >
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-[var(--color-text)] text-lg font-semibold border-b border-[var(--color-secondary)] pb-2">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="device_id"
                  className="block text-[var(--color-text)] mb-2"
                >
                  Shipment Number *
                </label>
                <input
                  id="device_id"
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={formData.device_id}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setFormData({ ...formData, device_id: value });
                  }}
                  className="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-secondary)] rounded text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                  placeholder="e.g., 1150"
                />
              </div>

              <div>
                <label
                  htmlFor="route_details"
                  className="block text-[var(--color-text)] mb-2"
                >
                  Route Details *
                </label>
                <select
                  id="route_details"
                  required
                  value={formData.route_details}
                  onChange={(e) =>
                    setFormData({ ...formData, route_details: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-secondary)] rounded text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="" disabled>
                    -- Select Route --
                  </option>
                  {routeOptions.map((route, index) => (
                    <option key={index} value={route}>
                      {route}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="device"
                  className="block text-[var(--color-text)] mb-2"
                >
                  Device *
                </label>
                <select
                  id="device"
                  required
                  value={formData.device}
                  onChange={(e) =>
                    setFormData({ ...formData, device: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-secondary)] rounded text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="" disabled>
                    -- Select Device --
                  </option>
                  {deviceOptions.map((device, index) => (
                    <option key={index} value={device}>
                      {device}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="po_number"
                  className="block text-[var(--color-text)] mb-2"
                >
                  PO Number *
                </label>
                <input
                  id="po_number"
                  type="text"
                  required
                  pattern="[A-Za-z0-9-]+"
                  title="only letters, numbers and hyphens are allowed"
                  value={formData.po_number}
                  onChange={(e) =>
                    setFormData({ ...formData, po_number: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-secondary)] rounded text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                  placeholder="PO-12345"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="ndc_number"
                  className="block text-[var(--color-text)] mb-2"
                >
                  NDC Number *
                </label>
                <input
                  id="ndc_number"
                  type="text"
                  required
                  pattern="[A-Za-z0-9-]+"
                  title="only letters, numbers and hyphens are allowed"
                  value={formData.ndc_number}
                  onChange={(e) =>
                    setFormData({ ...formData, ndc_number: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-secondary)] rounded text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                  placeholder="NDC-12345"
                />
              </div>

              <div>
                <label
                  htmlFor="serial_number"
                  className="block text-[var(--color-text)] mb-2"
                >
                  Serial Number of Goods *
                </label>
                <input
                  id="serial_number"
                  type="text"
                  required
                  pattern="[A-Za-z0-9-]+"
                  title="only letters, numbers and hyphens are allowed"
                  value={formData.serial_number}
                  onChange={(e) =>
                    setFormData({ ...formData, serial_number: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-[#151d30] border border-[#1e2a45] rounded text-white placeholder-[#4a5568] focus:outline-none focus:border-[#3b82f6]"
                  placeholder="SN-12345"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="container_number"
                  className="block text-[var(--color-text)] mb-2"
                >
                  Container Number *
                </label>
                <input
                  id="container_number"
                  type="text"
                  required
                  pattern="[A-Za-z0-9-]+"
                  title="only letters, numbers and hyphens are allowed"
                  value={formData.container_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      container_number: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-secondary)] rounded text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                  placeholder="CONT-12345"
                />
              </div>

              <div>
                <label
                  htmlFor="goods_type"
                  className="block text-[var(--color-text)] mb-2"
                >
                  Goods Type *
                </label>
                <select
                  id="goods_type"
                  required
                  value={formData.goods_type}
                  onChange={(e) =>
                    setFormData({ ...formData, goods_type: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-secondary)] rounded text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="" disabled>
                    -- Select Goods Type --
                  </option>
                  {goodsTypeOptions.map((type, index) => (
                    <option key={index} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="expected_delivery_date"
                  className="block text-[var(--color-text)] mb-2"
                >
                  Expected Delivery Date *
                </label>
                <div className="relative">
                  <input
                    id="expected_delivery_date"
                    type="date"
                    required
                    value={formData.expected_delivery_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expected_delivery_date: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-secondary)] rounded text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] pr-10"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="delivery_number"
                  className="block text-[var(--color-text)] mb-2"
                >
                  Delivery Number *
                </label>
                <input
                  id="delivery_number"
                  type="text"
                  required
                  pattern="[A-Za-z0-9-]+"
                  title="only letters, numbers and hyphens are allowed"
                  value={formData.delivery_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      delivery_number: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-secondary)] rounded text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                  placeholder="DEL-12345"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="batch_id"
                className="block text-[var(--color-text)] mb-2"
              >
                Batch Id *
              </label>
              <input
                id="batch_id"
                type="text"
                required
                pattern="[A-Za-z0-9-]+"
                title="only letters, numbers and hyphens are allowed"
                value={formData.batch_id}
                onChange={(e) =>
                  setFormData({ ...formData, batch_id: e.target.value })
                }
                className="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-secondary)] rounded text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                placeholder="BATCH-12345"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-[var(--color-text)] mb-2"
              >
                Shipment Description *
              </label>
              <textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-secondary)] rounded text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                placeholder="Enter shipment description"
                rows={4}
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-[var(--color-text)] mb-2"
              >
                Status *
              </label>
              <select
                id="status"
                required
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-4 py-3 bg-[var(--color-background)] border border-[var(--color-secondary)] rounded text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="p-4 mb-6 bg-[#1e1e2d] border-l-4 border-red-500 rounded-r">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-red-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-red-400 font-medium">Error</h3>
              </div>
              <p className="mt-1 text-[var(--color-text)]">{error.message}</p>
              {error.details && (
                <div className="mt-3 text-sm text-gray-300 border-t border-gray-700 pt-3">
                  {Array.isArray(error.details) ? (
                    <ul className="space-y-2">
                      {error.details.map((detail: any, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-red-400 mr-2">•</span>
                          <span>
                            {detail.loc && (
                              <span className="font-mono text-amber-400">
                                {detail.loc.join(".")}:{" "}
                              </span>
                            )}
                            {detail.msg || detail.message || String(detail)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : typeof error.details === "object" ? (
                    <pre className="mt-2 p-3 bg-[#151a2d] rounded text-sm text-gray-300 overflow-x-auto">
                      {JSON.stringify(error.details, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-gray-300">{String(error.details)}</div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-[var(--color-primary)] text-[var(--color-background)] rounded hover:bg-[var(--color-accent)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? "Creating..." : "Create Shipment"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex-1 py-3 bg-[var(--color-secondary)] text-[var(--color-text)] rounded hover:bg-[var(--color-accent)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
