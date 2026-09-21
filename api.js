// LG CUT — Mock API
// These functions simulate backend calls.
// Later, replace with real API endpoints.

import {
  services,
  locations,
  serviceZones,
  addOns,
  appointmentTypePricing,
} from "./data.js";

// Simulate network delay
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// Real backend base URL (Express API). Override with VITE_API_URL if needed.
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Add minutes to a "HH:MM" time string and return "HH:MM"
function addMinutes(timeStr, minutes) {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

// --- Services ---
export async function getServices() {
  await delay();
  return services;
}

export async function getServiceById(id) {
  await delay();
  return services.find((s) => s.id === id) || null;
}

// --- Locations ---
export async function getLocations() {
  await delay();
  return locations;
}

export async function getLocationById(id) {
  await delay();
  return locations.find((l) => l.id === id) || null;
}

// --- Service Zones ---
export async function getServiceZones() {
  await delay();
  return serviceZones.filter((z) => z.active);
}

// --- Add-ons ---
export async function getAddOns() {
  await delay();
  return addOns.filter((a) => a.active !== false);
}

// --- Service Area Validation ---
// Asks the backend whether an address is within a configured service zone.
// The backend is the source of truth — the frontend never decides serviceability.
export async function checkServiceArea(address) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/service-area/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
  } catch {
    return {
      available: false,
      zone: null,
      travelFee: 0,
      estimatedTravelTime: "",
      message: "We couldn't check service availability right now. Please try again.",
    };
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!body || !body.success) {
    return {
      available: false,
      zone: null,
      travelFee: 0,
      estimatedTravelTime: "",
      message: body?.message || "Home service isn't available in this area.",
    };
  }

  const zone = body.data.zone;
  return {
    available: true,
    zone,
    travelFee: 0,
    estimatedTravelTime: zone.estimatedTravelTime || `${zone.travelTimeMinutes} minutes`,
    message: "Home service available",
  };
}

// --- Availability ---
// Returns available time slots from the backend for a given date, service and
// appointment type. The backend enforces working hours, notice, buffer, travel
// time and existing-booking conflicts.
export async function getAvailability({ date }) {
  const params = new URLSearchParams({ date });

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/availability?${params.toString()}`);
  } catch {
    return { slots: [], message: "We couldn't load available times. Please try again." };
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!body || !body.success) {
    return { slots: [], message: body?.message || "We couldn't load available times." };
  }

  const data = body.data;
  const slots = (data.slots || []).map((slot) => ({
    id: slot.id,
    time: slot.startTime,
    endTime: slot.endTime,
    display: formatTime(slot.startTime),
    status: "available",
  }));

  return {
    slots,
    message: data.message || (slots.length === 0 ? "No appointments available for this date." : null),
  };
}

export async function getAvailableDates() {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/availability`);
  } catch {
    return { dates: null, message: "We couldn't load available dates." };
  }
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.success) return { dates: null, message: body?.message || "We couldn't load available dates." };
  return { dates: Array.isArray(body.data?.dates) ? body.data.dates : [], message: null };
}

// --- Price Calculation ---
export async function calculatePrice({ serviceId, appointmentType, locationId, serviceZoneId, addOnIds }) {
  await delay(200);

  const service = services.find((s) => s.id === serviceId);
  if (!service) return null;

  const location = locations.find((l) => l.id === locationId);
  const zone = serviceZones.find((z) => z.id === serviceZoneId);

  let price = 0;
  let priceBreakdown = [];

  if (appointmentType === "visit") {
    price = service.visitPrice;
    priceBreakdown.push({ label: "Service price", amount: service.visitPrice });
  } else if (appointmentType === "home") {
    price = service.homePrice;
    priceBreakdown.push({ label: "Service price", amount: service.homePrice });
  }

  // Location price adjustment (only for visit)
  if (appointmentType === "visit" && location && location.priceAdjustment > 0) {
    price += location.priceAdjustment;
    priceBreakdown.push({ label: "Location adjustment", amount: location.priceAdjustment });
  }

  // Add-ons (e.g. dye / tint)
  const selectedAddOns = (Array.isArray(addOnIds) ? addOnIds : [])
    .map((id) => addOns.find((a) => a.id === id))
    .filter(Boolean);
  const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
  if (addOnsTotal > 0) {
    price += addOnsTotal;
    selectedAddOns.forEach((a) => priceBreakdown.push({ label: a.name, amount: a.price }));
  }

  return {
    basePrice: appointmentType === "visit" ? service.visitPrice : service.homePrice,
    locationAdjustment: appointmentType === "visit" && location ? location.priceAdjustment : 0,
    typeModifier: 0,
    travelFee: 0,
    addOnsTotal,
    addOns: selectedAddOns.map((a) => ({ id: a.id, name: a.name, price: a.price })),
    totalPrice: price,
    currency: "₦",
    breakdown: priceBreakdown,
  };
}

// --- Booking Creation ---
// Sends the booking to the real backend, which validates everything and
// generates the authoritative booking reference, price and duration.
export async function createBooking(bookingData) {
  const service = services.find((s) => s.id === bookingData.serviceId);
  const zone = serviceZones.find((z) => z.id === bookingData.serviceZoneId);

  // Map the frontend booking shape to the backend contract.
  const payload = {
    slotId: bookingData.slotId,
    serviceId: bookingData.serviceId,
    customStyleName: bookingData.customStyleName || "",
    appointmentType: bookingData.appointmentType,
    locationId: bookingData.appointmentType === "visit" ? bookingData.locationId : null,
    serviceZoneId: bookingData.appointmentType === "home" ? bookingData.serviceZoneId : null,
    address: bookingData.appointmentType === "home" ? bookingData.address : null,
    date: bookingData.date,
    startTime: bookingData.time,
    endTime: bookingData.time
      ? addMinutes(bookingData.time, (service?.duration || 45) + (zone?.travelTimeMinutes || 0))
      : null,
    customerName: bookingData.customerName,
    phone: bookingData.customerPhone,
    email: bookingData.customerEmail,
    notes: bookingData.notes || "",
    addOnIds: Array.isArray(bookingData.addOnIds) ? bookingData.addOnIds : [],
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return {
      success: false,
      message: "We couldn't reach the booking service. Please check your connection and try again.",
    };
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok || !body?.success) {
    return {
      success: false,
      message: body?.message || "We couldn't complete your booking. Please try again.",
      errors: body?.errors || null,
    };
  }

  // Backend is the source of truth for reference, price and duration.
  const data = body.data;
  return {
    success: true,
    bookingId: data.bookingId,
    booking: {
      ...bookingData,
      bookingId: data.bookingId,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    },
    // Authoritative values from the backend
    price: data.price,
    duration: data.duration,
    addOns: data.addOns || [],
    locationName: data.location,
    // Notification delivery report (email + telegram) from the backend
    notifications: data.notifications || [],
  };
}

// --- Utility ---

// --- Utility ---
function formatTime(timeStr) {
  const [hour, minute] = timeStr.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

export { formatTime };

// --- Appointment Type Pricing ---
export async function getAppointmentTypePricing() {
  await delay(200);
  return appointmentTypePricing;
}
