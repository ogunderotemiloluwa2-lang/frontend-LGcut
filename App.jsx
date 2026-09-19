import { useState, useEffect, useRef } from "react";
import {
  businessConfig,
  services,
  locations,
  addOns,
  pricingNote,
  aboutContent,
  testimonials,
} from "./data.js";

// Smoothly scroll an element into view, leaving room for the fixed navbar.
function scrollToElement(el, offset = 90) {
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "smooth" });
}
import {
  getServices,
  getLocations,
  checkServiceArea,
  getAvailability,
  getAvailableDates,
  calculatePrice,
  createBooking,
  formatTime,
} from "./api.js";
import { Logo, LogoMark } from "./Logo.jsx";
import { adminApi } from "./adminApi.js";

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const bookingSectionRef = useRef(null);

  // Booking state
  const [booking, setBooking] = useState({
    appointmentType: null,
    locationId: null,
    address: { street: "", area: "", city: "", state: "", landmark: "", directions: "" },
    serviceId: null,
    customStyleName: "",
    date: null,
    time: null,
    slotId: null,
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    notes: "",
    addOnIds: [],
  });

  const [serviceAreaStatus, setServiceAreaStatus] = useState(null);
  const [availability, setAvailability] = useState({ slots: [], loading: false, message: null });
  const [priceInfo, setPriceInfo] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);
  const [bookingStep, setBookingStep] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [notificationStatus, setNotificationStatus] = useState(null);
  const [isAdminPage, setIsAdminPage] = useState(window.location.hash === "#admin");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleHashChange = () => setIsAdminPage(window.location.hash === "#admin");
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Whenever the booking step changes (choosing an option, moving to the next
  // form, confirming, etc.) scroll the booking form back into view so the
  // customer always sees the part they need to fill in next.
  useEffect(() => {
    if (!showBooking) return;
    scrollToElement(bookingSectionRef.current);
  }, [bookingStep, bookingResult, showBooking]);

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  const handleBookClick = () => {
    setShowBooking(true);
    // Scroll to the booking form so the user sees what to select
    setTimeout(() => {
      const target = bookingSectionRef.current;
      if (!target) return;
      const navbarOffset = 90;
      const top = target.getBoundingClientRect().top + window.scrollY - navbarOffset;
      window.scrollTo({ top, behavior: "smooth" });
    }, 60);
  };

  // Selecting a service straight from the services grid should also start the
  // booking flow with that service pre-selected, then continue through the
  // normal steps (some customers never tap the "Book Appointment" button).
  const handleSelectService = (serviceId) => {
    setBooking((prev) => ({ ...prev, serviceId, customStyleName: "" }));
    setShowBooking(true);
    setBookingStep(0);
    setTimeout(() => {
      const target = bookingSectionRef.current;
      if (!target) return;
      const navbarOffset = 90;
      const top = target.getBoundingClientRect().top + window.scrollY - navbarOffset;
      window.scrollTo({ top, behavior: "smooth" });
    }, 60);
  };

  // A client may want a style whose name we don't have in the gallery. We still
  // let them book it: the typed name is stored and the "custom" service is used
  // for pricing/duration.
  const handleSelectCustomStyle = (name) => {
    setBooking((prev) => ({ ...prev, serviceId: "custom", customStyleName: name }));
    setShowBooking(true);
    setBookingStep(0);
    setTimeout(() => {
      const target = bookingSectionRef.current;
      if (!target) return;
      const navbarOffset = 90;
      const top = target.getBoundingClientRect().top + window.scrollY - navbarOffset;
      window.scrollTo({ top, behavior: "smooth" });
    }, 60);
  };

  const updateBooking = (field, value) => {
    setBooking((prev) => ({ ...prev, [field]: value }));
  };

  const updateAddress = (field, value) => {
    setBooking((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
    // Any edit invalidates the previous service-area result, so clear it and
    // let the customer re-check. This keeps the flow simple: type → check.
    setServiceAreaStatus(null);
  };

  const resetBooking = () => {
    setBooking({
      appointmentType: null,
      locationId: null,
      address: { street: "", area: "", city: "", state: "", landmark: "", directions: "" },
      serviceId: null,
      customStyleName: "",
      date: null,
      time: null,
      slotId: null,
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      notes: "",
      addOnIds: [],
    });
    setServiceAreaStatus(null);
    setAvailability({ slots: [], loading: false, message: null });
    setPriceInfo(null);
    setBookingResult(null);
    setBookingStep(0);
    setConfirming(false);
    setBookingError(null);
    setNotificationStatus(null);
  };

  const closeBooking = () => {
    setShowBooking(false);
    resetBooking();
  };

  const handleCancelAppointmentType = () => {
    updateBooking("appointmentType", null);
    updateBooking("locationId", null);
    updateBooking("address", { street: "", area: "", city: "", state: "", landmark: "", directions: "" });
    setServiceAreaStatus(null);
    setBookingStep(0);
  };

  // Determine current step
  const currentStep = bookingResult ? 6 : bookingStep;

  const steps = [
    { number: 0, label: "WHERE" },
    { number: 1, label: "WHERE" },
    { number: 2, label: "SERVICE" },
    { number: 3, label: "DATE & TIME" },
    { number: 4, label: "DETAILS" },
    { number: 5, label: "REVIEW" },
  ];

  const handleCheckServiceArea = async () => {
    if (!booking.address.street || !booking.address.area || !booking.address.city || !booking.address.state) return;
    setServiceAreaStatus({ loading: true, message: "Checking service availability..." });
    const result = await checkServiceArea(booking.address);
    setServiceAreaStatus({
      loading: false,
      available: result.available,
      zone: result.zone,
      travelFee: result.travelFee,
      estimatedTravelTime: result.estimatedTravelTime,
      message: result.message,
    });
  };

  const handleServiceSelect = async (serviceId) => {
    const serviceChanged = booking.serviceId !== serviceId;
    updateBooking("serviceId", serviceId);
    // Clear date/time only if service changed (duration affects availability)
    if (serviceChanged) {
      updateBooking("date", null);
      updateBooking("time", null);
      updateBooking("slotId", null);
      setAvailability({ slots: [], loading: false, message: null });
    }
    const price = await calculatePrice({
      serviceId,
      appointmentType: booking.appointmentType,
      locationId: booking.appointmentType === "visit" ? booking.locationId : null,
      serviceZoneId: booking.appointmentType === "home" ? serviceAreaStatus?.zone?.id : null,
      addOnIds: booking.addOnIds,
    });
    setPriceInfo(price);
  };

  const recalculatePrice = async (updatedBooking) => {
    if (!updatedBooking.serviceId) return;
    const price = await calculatePrice({
      serviceId: updatedBooking.serviceId,
      appointmentType: updatedBooking.appointmentType,
      locationId: updatedBooking.appointmentType === "visit" ? updatedBooking.locationId : null,
      serviceZoneId: updatedBooking.appointmentType === "home" ? serviceAreaStatus?.zone?.id : null,
      addOnIds: updatedBooking.addOnIds,
    });
    setPriceInfo(price);
  };

  // Toggle an optional add-on (e.g. dye / tint) and refresh the price.
  const handleAddOnToggle = async (addOnId) => {
    const current = booking.addOnIds || [];
    const next = current.includes(addOnId)
      ? current.filter((id) => id !== addOnId)
      : [...current, addOnId];
    const updated = { ...booking, addOnIds: next };
    setBooking(updated);
    await recalculatePrice(updated);
  };

  const handleDateSelect = async (date) => {
    updateBooking("date", date);
    updateBooking("time", null);
    updateBooking("slotId", null);
    setAvailability({ slots: [], loading: true, message: null });
    const result = await getAvailability({ date });
    setAvailability({ slots: result.slots, loading: false, message: result.message });
  };

  const handleTimeSelect = (slot) => {
    updateBooking("time", slot.time);
    updateBooking("slotId", slot.id);
  };

  const handleConfirmBooking = async () => {
    if (confirming) return;
    setConfirming(true);
    setBookingError(null);
    setNotificationStatus(null);

    // 1. Send to the backend first — it validates and generates the reference.
    const result = await createBooking({
      ...booking,
      serviceZoneId: booking.appointmentType === "home" ? serviceAreaStatus?.zone?.id : null,
      priceInfo,
    });

    // Backend rejected (unavailable / invalid) — do NOT notify, allow retry.
    if (!result.success) {
      setBookingError(result.message || "We couldn't complete your booking. Please try again.");
      setConfirming(false);
      return;
    }

    // 2. Backend accepted — it already notified the company on BOTH email and
    // Telegram. Surface the delivery report so the customer knows if anything
    // failed (the booking itself is always safe).
    const report = Array.isArray(result.notifications) ? result.notifications : [];
    const failed = report.filter((r) => r && r.success === false && !r.skipped);
    setNotificationStatus(
      failed.length
        ? { success: false, message: "Some notifications could not be delivered." }
        : { success: true }
    );

    // 3. Show the confirmation screen regardless of notification outcome.
    setBookingResult(result);
    setConfirming(false);
  };

  const goBack = () => {
    if (currentStep === 5) {
      // Going back from Review - go to customer details without clearing
      setBookingStep(4);
    }
    if (currentStep === 4) {
      // Going back from Details - clear time
      updateBooking("time", null);
      updateBooking("slotId", null);
      setBookingStep(3);
    }
    if (currentStep === 3) {
      // Going back from Date & Time - clear date
      updateBooking("date", null);
      updateBooking("time", null);
      updateBooking("slotId", null);
      setAvailability({ slots: [], loading: false, message: null });
      setBookingStep(2);
    }
    if (currentStep === 2) {
      // Going back from Service - clear serviceId
      updateBooking("serviceId", null);
      setPriceInfo(null);
      setBookingStep(1);
    }
    if (currentStep === 1) {
      // Going back from Where - clear appointment type
      updateBooking("appointmentType", null);
      updateBooking("locationId", null);
      updateBooking("address", { street: "", area: "", city: "", state: "", landmark: "", directions: "" });
      setServiceAreaStatus(null);
      setBookingStep(0);
    }
  };

  // Edit booking from review — jump back to the requested step
  const handleEditBooking = (step) => {
    if (step === "service") {
      setBookingStep(2);
    } else if (step === "location") {
      setBookingStep(1);
    } else if (step === "datetime") {
      setBookingStep(3);
    } else if (step === "customer") {
      setBookingStep(4);
    } else {
      setBookingStep(4);
    }
  };

  if (isAdminPage) return <AdminPanel />;

  return (
    <>
      {/* ===== NAVBAR ===== */}
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="container flex flex-between">
          <a href="#" className="navbar__logo" aria-label="LG CUT — home">
            <Logo tone="light" size={42} />
          </a>

          <div className={`navbar__nav ${mobileMenuOpen ? "open" : ""}`}>
            <a href="#services" className="navbar__link" onClick={handleNavClick}>Services</a>
            <a href="#locations" className="navbar__link" onClick={handleNavClick}>Locations</a>
            <a href="#about" className="navbar__link" onClick={handleNavClick}>About</a>
            <a href="#contact" className="navbar__link" onClick={handleNavClick}>Contact</a>
            <a href="#admin" className="navbar__mobile-admin" onClick={handleNavClick}>Admin Login</a>
          </div>

          {mobileMenuOpen && (
            <div
              className="navbar__overlay"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          <div className="navbar__cta">
            <a href="#admin" className="navbar__admin-link" onClick={handleNavClick}>Admin Login</a>
            <a href="#book" className="btn btn--gold btn--small" onClick={handleBookClick}>Book Appointment</a>
          </div>

          <button
            className={`navbar__toggle ${mobileMenuOpen ? "open" : ""}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="container">
          <div className="hero__grid">
            <div className="hero__content">
              <span className="hero__label label-sm text-accent">Premium Barbering</span>
              <h1 className="hero__title">
                Your cut.
                <br />
                <em>Your time.</em>
              </h1>
              <p className="hero__subtitle">
                LG CUT crafts sharp, intentional grooming for men in FUNAAB and Abeokuta.
                Visit our shop or request a home service — we come to you.
              </p>
              <div className="hero__cta">
                <a href="#book" className="btn btn--primary btn--large" onClick={handleBookClick}>Book Appointment</a>
                <a href="#services" className="btn btn--secondary btn--large">Explore Services</a>
              </div>
            </div>
            <div className="hero__image">
              <div className="hero__image-wrapper">
                <img
                  src="/images/lgcut-2.jpg"
                  alt="Barber cutting hair at LG CUT"
                  className="hero__img"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SERVICES ===== */}
      <section id="services" className="section-sm">
        <div className="container">
          <div className="section-header">
            <span className="label-sm text-accent">Services</span>
            <h2 className="section-title">Crafted Cuts</h2>
            <p className="section-subtitle">
              Know the name of your style? Type it below to see the price. Not sure?
              Browse the gallery and tap the look you want.
            </p>
            <p className="pricing-note">{pricingNote}</p>
          </div>

          <ServicesSection
            services={services}
            onSelect={handleSelectService}
            onSelectCustom={handleSelectCustomStyle}
          />
        </div>
      </section>

      {/* ===== LOCATIONS ===== */}
      <section id="locations" className="section">
        <div className="container">
          <div className="section-header">
            <span className="label-sm text-accent">Locations</span>
            <h2 className="section-title">Find Us</h2>
            <p className="section-subtitle">
              Two shops serving FUNAAB and Central Abeokuta.
            </p>
          </div>

          <div className="locations-grid">
            {locations.map((location) => (
              <LocationCard key={location.id} location={location} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== ABOUT ===== */}
      <section id="about" className="section-sm">
        <div className="container">
          <div className="about-grid">
            <div className="about__image">
              <div className="about__image-wrapper">
                <img
                  src="/images/lgcut-1.jpg"
                  alt="Samuel Ogunleye, founder of LG CUT"
                  className="about__img"
                />
              </div>
            </div>
            <div className="about__content">
              <span className="label-sm text-accent">Our Philosophy</span>
              <h2 className="about__title">{aboutContent.philosophy}</h2>
              <p className="about__body">{aboutContent.body}</p>
              <p className="about__founder">— {aboutContent.founder}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="section-sm">
        <div className="container">
          <div className="section-header">
            <span className="label-sm text-accent">What Our Clients Say</span>
            <h2 className="section-title">In Their Own Words</h2>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== BOOKING CTA ===== */}
      <section id="book" className="booking-cta section">
        <div className="container">
          <div className="booking-cta__content">
            <h2 className="booking-cta__title">Ready for your cut?</h2>
            <p className="booking-cta__subtitle">
              Book your appointment in under a minute. Choose your service,
              appointment type, and time — all online.
            </p>
            <a href="#book" className="btn btn--gold btn--large" onClick={handleBookClick}>Book Appointment</a>
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section id="contact" className="section-sm">
        <div className="container">
          <div className="contact-grid">
            <div className="contact__info">
              <span className="label-sm text-accent">Contact</span>
              <h2 className="contact__title">Get in Touch</h2>
              <p className="contact__subtitle">
                Have a question? Reach out and we'll respond within 2 hours.
              </p>
              <div className="contact__details">
                <div className="contact__item">
                  <span className="contact__label">Phone</span>
                  <a href={`tel:${businessConfig.phone}`} className="contact__value link link--gold">
                    {businessConfig.phone}
                  </a>
                </div>
                <div className="contact__item">
                  <span className="contact__label">Email</span>
                  <a href={`mailto:${businessConfig.email}`} className="contact__value link link--gold">
                    {businessConfig.email}
                  </a>
                </div>
                <div className="contact__item">
                  <span className="contact__label">Service Area</span>
                  <span className="contact__value">FUNAAB & Abeokuta, Ogun State</span>
                </div>
              </div>
            </div>

            <div className="contact__form-wrapper">
              <form className="contact-form">
                <div className="form-grid">
                  <input type="text" placeholder="Full Name" required />
                  <input type="tel" placeholder="Phone Number" required />
                  <input type="email" placeholder="Email Address" required />
                  <textarea placeholder="Your message..." rows="4" required></textarea>
                </div>
                <button type="submit" className="btn btn--primary">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BOOKING FLOW ===== */}
      {showBooking && (
        <section className="booking" ref={bookingSectionRef}>
          <div className="booking__container">
            <div className="booking__header">
              <h1 className="booking__title">Book Your Appointment</h1>
              <p className="booking__subtitle">
                {booking.appointmentType === "home"
                  ? "We'll come to you — just tell us where."
                  : "Visit us at LG CUT for a premium cut."}
              </p>
            </div>

            <Stepper steps={steps} currentStep={currentStep} />

            <div className="booking__layout">
              <div className="booking-card">
                {currentStep === 0 && (
                  <AppointmentTypeStep
                    booking={booking}
                    updateBooking={updateBooking}
                    onNext={() => setBookingStep(1)}
                    onAppointmentTypeChange={async (type) => {
                      const updated = { ...booking, appointmentType: type, locationId: type === "visit" ? "funaab" : null };
                      await recalculatePrice(updated);
                    }}
                  />
                )}
                {currentStep === 1 && (
                  <AddressStep
                    booking={booking}
                    updateAddress={updateAddress}
                    serviceAreaStatus={serviceAreaStatus}
                    setServiceAreaStatus={setServiceAreaStatus}
                    onCheckServiceArea={handleCheckServiceArea}
                    onCancelAppointmentType={handleCancelAppointmentType}
                    onNext={() => setBookingStep(2)}
                  />
                )}
                {currentStep === 2 && (
                  <ServiceStep
                    booking={booking}
                    services={services}
                    addOns={addOns}
                    priceInfo={priceInfo}
                    onServiceSelect={handleServiceSelect}
                    onAddOnToggle={handleAddOnToggle}
                    onNext={() => setBookingStep(3)}
                  />
                )}
                {currentStep === 3 && (
                  <DateTimeStep
                    booking={booking}
                    availability={availability}
                    onDateSelect={handleDateSelect}
                    onTimeSelect={handleTimeSelect}
                    onNext={() => setBookingStep(4)}
                  />
                )}
                {currentStep === 4 && (
                  <CustomerDetailsStep
                    booking={booking}
                    updateBooking={updateBooking}
                    onNext={() => setBookingStep(5)}
                  />
                )}
                {currentStep === 5 && (
                  <ReviewStep
                    booking={booking}
                    priceInfo={priceInfo}
                    serviceAreaStatus={serviceAreaStatus}
                    locations={locations}
                    services={services}
                    onConfirm={handleConfirmBooking}
                    onEdit={handleEditBooking}
                    bookingError={bookingError}
                  />
                )}
                {currentStep === 6 && (
                  <ConfirmationStep
                    bookingResult={bookingResult}
                    booking={booking}
                    priceInfo={priceInfo}
                    serviceAreaStatus={serviceAreaStatus}
                    locations={locations}
                    services={services}
                    notificationStatus={notificationStatus}
                    onNewBooking={resetBooking}
                    onBackHome={closeBooking}
                  />
                )}
              </div>

              {/* Sticky Booking Summary */}
              {currentStep >= 1 && currentStep < 5 && (
                <BookingSummary
                  booking={booking}
                  priceInfo={priceInfo}
                  serviceAreaStatus={serviceAreaStatus}
                  locations={locations}
                  services={services}
                />
              )}
            </div>

            {currentStep < 6 && (
              <div className="booking__nav">
                {currentStep > 0 && (
                  <button className="btn booking__nav-back" onClick={goBack}>
                    ← Back
                  </button>
                )}
                <div style={{ flex: currentStep === 0 ? 1 : "unset" }} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="container">
          <div className="footer__grid">
            <div className="footer__brand">
              <Logo tone="light" size={46} />
              <p className="footer__tagline">{businessConfig.tagline}</p>
              <p className="footer__copyright">
                © {new Date().getFullYear()} LG CUT. All rights reserved.
              </p>
            </div>

            <div className="footer__links">
              <h4>Quick Links</h4>
              <a href="#services">Services</a>
              <a href="#locations">Locations</a>
              <a href="#about">About</a>
              <a href="#contact">Contact</a>
            </div>

            <div className="footer__links">
              <h4>Services</h4>
              {services.slice(0, 6).map((s) => (
                <a key={s.id} href="#services">{s.name}</a>
              ))}
            </div>

            <div className="footer__links">
              <h4>Locations</h4>
              {locations.map((l) => (
                <a key={l.id} href="#locations">{l.name}</a>
              ))}
            </div>

            <div className="footer__links">
              <h4>Contact</h4>
              <a
                href={businessConfig.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="footer__whatsapp"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.09 3.2 5.07 4.49.71.31 1.26.49 1.69.63.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35Z" />
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Z" />
                </svg>
                WhatsApp: {businessConfig.whatsappNumber}
              </a>
              <a href={`tel:${businessConfig.phone}`}>Call: {businessConfig.phone}</a>
              <a href={`mailto:${businessConfig.email}`}>{businessConfig.email}</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

/* ===== Admin Dashboard ===== */
// Deliberately simple: sign in, see appointments, mark them done or cancel,
// and manage the time slots customers can book. Nothing else.
function AdminPanel() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [slotForm, setSlotForm] = useState({ date: "", startTime: "10:00", endTime: "11:00" });

  const loadData = async (authToken = token) => {
    setError("");
    try {
      const [availabilityResult, bookingResult] = await Promise.all([
        adminApi.getAvailability(authToken),
        adminApi.getBookings(authToken),
      ]);
      setSlots(availabilityResult.data || []);
      setBookings(bookingResult.data || []);
      setAuthenticated(true);
    } catch (requestError) {
      setAuthenticated(false);
      setError(requestError.message);
    }
  };

  const runAction = async (action, successMessage) => {
    setError("");
    try {
      await action();
      setMessage(successMessage);
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    await loadData(token);
  };

  const handleAddSlot = async (event) => {
    event.preventDefault();
    await runAction(() => adminApi.createAvailability(token, slotForm), "Time slot added");
  };

  // Soonest first, so the next appointment is always at the top.
  const sortedBookings = [...bookings].sort((a, b) =>
    `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)
  );
  const sortedSlots = [...slots].sort((a, b) =>
    `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)
  );

  return (
    <main className="admin-page">
      <div className="admin-shell">
        <div className="admin-header">
          <Logo tone="dark" size={48} />
          <a href="#" className="link link--gold">Back to site</a>
        </div>

        {!authenticated ? (
          <form className="admin-login" onSubmit={handleLogin}>
            <h2>Admin</h2>
            <p>Enter your password to continue.</p>
            <input type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Password" required autoFocus />
            <button className="btn btn--primary" type="submit">Enter</button>
          </form>
        ) : (
          <>
            <div className="admin-title-row">
              <h1 className="admin-title">Dashboard</h1>
              <button className="btn btn--ghost btn--small" onClick={() => { setAuthenticated(false); setToken(""); }}>Sign out</button>
            </div>

            <section className="admin-section">
              <div className="admin-section__header">
                <h2>Appointments</h2>
                <span>{sortedBookings.length} total</span>
              </div>
              {sortedBookings.length === 0 ? (
                <p className="admin-empty">No appointments yet.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr><th>When</th><th>Customer</th><th>Service</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {sortedBookings.map((booking) => (
                        <tr key={booking.id}>
                          <td>{booking.date}<small>{booking.startTime} – {booking.endTime}</small></td>
                          <td>{booking.customerName}<small>{booking.customerPhone}</small></td>
                          <td>{booking.customStyleName || booking.service}</td>
                          <td><span className={`admin-status admin-status--${booking.status}`}>{booking.status}</span></td>
                          <td>
                            {["pending", "confirmed"].includes(booking.status) ? (
                              <>
                                <button className="link-button" onClick={() => runAction(() => adminApi.updateBooking(token, booking.id, { status: "completed" }), "Marked as done")}>Done</button>
                                <button className="link-button link-button--danger" onClick={() => { if (window.confirm("Cancel this appointment?")) runAction(() => adminApi.updateBooking(token, booking.id, { status: "cancelled" }), "Appointment cancelled"); }}>Cancel</button>
                              </>
                            ) : (
                              <button className="link-button" onClick={() => runAction(() => adminApi.updateBooking(token, booking.id, { status: "confirmed" }), "Appointment reopened")}>Reopen</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="admin-section">
              <div className="admin-section__header">
                <h2>Availability</h2>
                <span>{sortedSlots.length} time slots</span>
              </div>
              <form className="admin-slot-form" onSubmit={handleAddSlot}>
                <input type="date" value={slotForm.date} onChange={(event) => setSlotForm({ ...slotForm, date: event.target.value })} required />
                <input type="time" value={slotForm.startTime} onChange={(event) => setSlotForm({ ...slotForm, startTime: event.target.value })} required />
                <input type="time" value={slotForm.endTime} onChange={(event) => setSlotForm({ ...slotForm, endTime: event.target.value })} required />
                <button className="btn btn--primary btn--small" type="submit">Add time slot</button>
              </form>
              {sortedSlots.length === 0 ? (
                <p className="admin-empty">No time slots yet. Add one above.</p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Date</th><th>Time</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {sortedSlots.map((slot) => (
                        <tr key={slot.id}>
                          <td>{slot.date}</td>
                          <td>{slot.startTime} – {slot.endTime}</td>
                          <td><span className={`admin-status admin-status--${slot.status}`}>{slot.status}</span></td>
                          <td>
                            {slot.status === "booked" ? (
                              <span className="admin-note">Booked</span>
                            ) : (
                              <>
                                <button className="link-button" onClick={() => runAction(() => adminApi.updateAvailability(token, slot.id, { status: slot.status === "available" ? "unavailable" : "available" }), slot.status === "available" ? "Slot closed" : "Slot opened")}>
                                  {slot.status === "available" ? "Close" : "Open"}
                                </button>
                                <button className="link-button link-button--danger" onClick={() => { if (window.confirm("Remove this time slot?")) runAction(() => adminApi.deleteAvailability(token, slot.id), "Time slot removed"); }}>Remove</button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
        {message && <p className="admin-message">{message}</p>}
        {error && <p className="admin-error" role="alert">{error}</p>}
      </div>
    </main>
  );
}

/* ===== Services Section (search + gallery) ===== */
function ServicesSection({ services, onSelect, onSelectCustom }) {
  const [query, setQuery] = useState("");
  const [showGallery, setShowGallery] = useState(false);

  // The gallery only shows real, photographed styles — not the custom fallback.
  const galleryServices = services.filter((s) => !s.isCustom && s.showInGallery !== false);

  const q = query.trim().toLowerCase();
  const matches = q
    ? galleryServices.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      )
    : [];

  const openGallery = () => {
    setShowGallery(true);
    setTimeout(() => {
      const el = document.getElementById("style-gallery");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  return (
    <div className="services-section">
      {/* Search: type the style you want and see the price */}
      <div className="style-search">
        <label className="style-search__label" htmlFor="style-search-input">
          Type your hairstyle
        </label>
        <div className="style-search__box">
          <svg className="style-search__icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            id="style-search-input"
            type="text"
            className="style-search__input"
            placeholder="e.g. fade, afro, cornrows, waves…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              className="style-search__clear"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Results for the typed style */}
        {q && (
          <div className="style-search__results">
            {matches.length > 0 ? (
              matches.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  className="style-result"
                  onClick={() => onSelect(service.id)}
                >
                  <div className="style-result__image">
                    <img src={service.image} alt={service.name} loading="lazy" decoding="async" />
                  </div>
                  <div className="style-result__body">
                    <span className="style-result__name">{service.name}</span>
                    <span className="style-result__desc">{service.description}</span>
                  </div>
                  <div className="style-result__price">
                    <span className="style-result__amount">₦{service.basePrice.toLocaleString()}</span>
                    <span className="style-result__cta">Book →</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="style-search__empty">
                <p>
                  We don't have a style called “{query}” in our gallery — but that's fine.
                  You can still book it and we'll cut it for you.
                </p>
                <button
                  type="button"
                  className="btn btn--primary btn--small"
                  onClick={() => onSelectCustom(query.trim())}
                >
                  Book “{query.trim()}” →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Button that leads to the gallery for clients who prefer to pick visually */}
        <div className="style-search__gallery-cta">
          <button
            type="button"
            className="btn btn--primary"
            onClick={openGallery}
          >
            Browse the gallery instead →
          </button>
        </div>
      </div>

      {/* Gallery: for clients who don't know the name of the style */}
      <div className="gallery" id="style-gallery">
        <div className="gallery__head">
          <h3 className="gallery__title">Not sure of the name? Browse the gallery</h3>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={() => setShowGallery((v) => !v)}
          >
            {showGallery ? "Hide styles" : "Show styles"}
          </button>
        </div>

        {showGallery && (
          <div className="services-grid">
            {galleryServices.map((service) => (
              <ServiceCard key={service.id} service={service} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== Service Card Component ===== */
function ServiceCard({ service, onSelect }) {
  return (
    <div
      className="service-card service-card--clickable"
      role="button"
      tabIndex={0}
      onClick={() => onSelect && onSelect(service.id)}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onSelect) {
          e.preventDefault();
          onSelect(service.id);
        }
      }}
    >
      <div className="service-card__image">
        <img src={service.image} alt={service.name} loading="lazy" decoding="async" />
      </div>
      <div className="service-card__content">
        <span className="label-sm text-accent">{service.category}</span>
        <h3 className="service-card__title">{service.name}</h3>
        <p className="service-card__desc">{service.description}</p>
        <div className="service-card__meta">
          <span className="service-card__duration">{service.duration} min</span>
          <span className="service-card__price price">From ₦{service.basePrice.toLocaleString()}</span>
        </div>
        <span className="service-card__cta">Book this style →</span>
      </div>
    </div>
  );
}

/* ===== Location Card Component ===== */
function LocationCard({ location }) {
  // Format a "HH:MM" 24h time into a friendly 12h label.
  const formatHour = (t) => {
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}:${String(m).padStart(2, "0")} ${period}`;
  };

  // Summarise the location's opening hours. LG CUT is open every day, so we
  // show a single line when all days share the same hours.
  const hours = location.openingHours || {};
  const days = Object.values(hours);
  const openDays = days.filter((d) => d && !d.closed);
  const allSame =
    openDays.length > 0 &&
    openDays.every((d) => d.open === openDays[0].open && d.close === openDays[0].close);

  return (
    <div className="location-card">
      <div className="location-card__image">
        <img src={location.image} alt={location.name} />
      </div>
      <div className="location-card__content">
        <h3 className="location-card__title">{location.name}</h3>
        <p className="location-card__address">{location.state}</p>
        <div className="location-card__hours">
          <span className="label-sm text-accent">Opening Hours</span>
          {allSame ? (
            <p>
              Open every day: {formatHour(openDays[0].open)} – {formatHour(openDays[0].close)}
            </p>
          ) : (
            <p>
              {formatHour(openDays[0]?.open || "10:00")} – {formatHour(openDays[0]?.close || "18:00")}
            </p>
          )}
        </div>
        <a href="#book" className="link link--gold">Book at this location →</a>
      </div>
    </div>
  );
}

/* ===== Testimonial Card Component ===== */
function TestimonialCard({ testimonial }) {
  return (
    <div className="testimonial-card">
      <div className="testimonial-card__image">
        <img src={testimonial.image} alt={testimonial.name} />
      </div>
      <div className="testimonial-card__content">
        <p className="testimonial-card__quote">"{testimonial.quote}"</p>
        <div className="testimonial-card__author">
          <span className="testimonial-card__name">{testimonial.name}</span>
          <span className="testimonial-card__role">{testimonial.role}</span>
        </div>
      </div>
    </div>
  );
}

/* ===== Stepper Component ===== */
function Stepper({ steps, currentStep }) {
  return (
    <div className="stepper">
      {steps.map((step) => (
        <div
          key={step.number}
          className={`stepper__step ${step.number === currentStep ? "active" : ""} ${step.number < currentStep ? "completed" : ""}`}
        >
          <div className="stepper__circle">{step.number}</div>
          <span className="stepper__label">{step.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ===== Appointment Type Step ===== */
function AppointmentTypeStep({ booking, updateBooking, onNext, onAppointmentTypeChange }) {
  const stepRef = useRef(null);

  const handleSelect = (type) => {
    updateBooking("appointmentType", type);
    if (type === "visit") {
      updateBooking("locationId", "funaab");
    }
    if (onAppointmentTypeChange) {
      onAppointmentTypeChange(type);
    }
    // Scroll the form into view so the user sees what to do next
    requestAnimationFrame(() => {
      const target = stepRef.current?.closest(".booking-card") || stepRef.current;
      if (!target) return;
      const navbarOffset = 90;
      const top = target.getBoundingClientRect().top + window.scrollY - navbarOffset;
      window.scrollTo({ top, behavior: "smooth" });
    });
  };

  const handleCancel = () => {
    updateBooking("appointmentType", null);
    updateBooking("locationId", null);
    updateBooking("address", { street: "", area: "", city: "", state: "", landmark: "", directions: "" });
  };

  const canProceed = booking.appointmentType !== null;

  return (
    <div className="appointment-type" ref={stepRef}>
      <div className="appointment-type__options">
        <button
          type="button"
          className={`appointment-type__option ${booking.appointmentType === "visit" ? "selected" : ""}`}
          onClick={() => handleSelect("visit")}
          aria-pressed={booking.appointmentType === "visit"}
        >
          <span className="appointment-type__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3.5 9 5 4h14l1.5 5" />
              <path d="M4 9v10.5a.5.5 0 0 0 .5.5h15a.5.5 0 0 0 .5-.5V9" />
              <path d="M3.5 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" />
              <path d="M9.5 20v-5.5h5V20" />
            </svg>
          </span>
          <span className="appointment-type__body">
            <span className="appointment-type__name">Visit LG CUT</span>
            <span className="appointment-type__desc">Come to our barbershop for a premium cut</span>
          </span>
          <span className="appointment-type__check" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
        </button>

        <button
          type="button"
          className={`appointment-type__option ${booking.appointmentType === "home" ? "selected" : ""}`}
          onClick={() => handleSelect("home")}
          aria-pressed={booking.appointmentType === "home"}
        >
          <span className="appointment-type__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5 9.5V20a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5V9.5" />
              <path d="M9.5 20.5V14h5v6.5" />
            </svg>
          </span>
          <span className="appointment-type__body">
            <span className="appointment-type__name">Home Service</span>
            <span className="appointment-type__desc">We come to your location</span>
          </span>
          <span className="appointment-type__check" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
        </button>
      </div>

      {booking.appointmentType === "visit" && (
        <div className="appointment-type__note">
          <span className="appointment-type__note-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
            </svg>
          </span>
          <p className="appointment-type__note-text">
            Prefer to ask first? Message us on WhatsApp before you book.
          </p>
          <a
            href={`https://wa.me/2348141255405?text=${encodeURIComponent("Hello LG CUT! I'd like to know more about visiting your barbershop.")}`}
            className="appointment-type__note-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Chat on WhatsApp
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        </div>
      )}

      <div className="appointment-type__actions">
        {booking.appointmentType && (
          <button
            type="button"
            className="appointment-type__cancel btn btn--ghost btn--small"
            onClick={handleCancel}
          >
            Cancel Selection
          </button>
        )}
        {canProceed && (
          <button type="button" className="btn btn--primary appointment-type__next" onClick={onNext}>
            Continue
          </button>
        )}
      </div>
    </div>
  );
}

/* ===== Address Step ===== */
function AddressStep({ booking, updateAddress, serviceAreaStatus, setServiceAreaStatus, onCheckServiceArea, onCancelAppointmentType, onNext }) {
  const isHome = booking.appointmentType === "home";
  const canCheck = booking.address.street && booking.address.area && booking.address.city && booking.address.state;

  // Auto-check the service area as soon as the required fields are filled.
  // Debounced so we don't fire a request on every keystroke — the customer
  // just types their address and the result appears on its own.
  useEffect(() => {
    if (!isHome || !canCheck) return undefined;
    const timer = setTimeout(() => {
      onCheckServiceArea();
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking.address.street, booking.address.area, booking.address.city, booking.address.state, isHome, canCheck]);

  return (
    <div>
      <div className="address-step__header">
        <button
          className="btn btn--ghost btn--small address-step__change"
          onClick={onCancelAppointmentType}
        >
          ← Change
        </button>
      </div>
      {isHome ? (
        <>
          <div className="address-form__grid">
            <div className="address-form__field">
              <label className="address-form__label">Street Address</label>
              <input
                type="text"
                className="address-form__input"
                placeholder="e.g. 12 Olabisi Onabanjo Way"
                value={booking.address.street}
                onChange={(e) => updateAddress("street", e.target.value)}
              />
            </div>
            <div className="address-form__field">
              <label className="address-form__label">Area / Neighborhood</label>
              <input
                type="text"
                className="address-form__input"
                placeholder="e.g. Alabata"
                value={booking.address.area}
                onChange={(e) => updateAddress("area", e.target.value)}
              />
            </div>
            <div className="address-form__field">
              <label className="address-form__label">City</label>
              <input
                type="text"
                className="address-form__input"
                placeholder="e.g. FUNAAB"
                value={booking.address.city}
                onChange={(e) => updateAddress("city", e.target.value)}
              />
            </div>
            <div className="address-form__field">
              <label className="address-form__label">State</label>
              <select
                className="address-form__input"
                value={booking.address.state}
                onChange={(e) => updateAddress("state", e.target.value)}
              >
                <option value="">Select state</option>
                <option value="Ogun State">Ogun State</option>
              </select>
            </div>
            <div className="address-form__field full-width">
              <label className="address-form__label">Landmark (Optional)</label>
              <input
                type="text"
                className="address-form__input"
                placeholder="e.g. Near Alabata Market"
                value={booking.address.landmark}
                onChange={(e) => updateAddress("landmark", e.target.value)}
              />
            </div>
            <div className="address-form__field full-width">
              <label className="address-form__label">Directions (Optional)</label>
              <input
                type="text"
                className="address-form__input"
                placeholder="Any additional directions..."
                value={booking.address.directions}
                onChange={(e) => updateAddress("directions", e.target.value)}
              />
            </div>
          </div>

          {!canCheck && (
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", textAlign: "center", marginTop: "0.5rem" }}>
              Fill in your street, area, city and state — we'll check availability automatically.
            </p>
          )}

          {serviceAreaStatus?.loading && (
            <div className="service-area-check">
              <div className="service-area-check__status">
                <div className="service-area-check__spinner"></div>
                <span>{serviceAreaStatus.message}</span>
              </div>
            </div>
          )}

          {serviceAreaStatus && !serviceAreaStatus.loading && (
            <div className={`service-area-check ${serviceAreaStatus.available ? "service-area-check__available" : "service-area-check__unavailable"}`}>
              <div className="service-area-check__status">
                <span className="service-area-check__icon">
                  {serviceAreaStatus.available ? "✓" : "✕"}
                </span>
                <span>{serviceAreaStatus.message}</span>
              </div>
              {serviceAreaStatus.available && serviceAreaStatus.zone && (
                <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "0.5rem" }}>
                  Zone: {serviceAreaStatus.zone.name} · Travel fee: ₦{serviceAreaStatus.travelFee.toLocaleString()} · ETA: {serviceAreaStatus.estimatedTravelTime}
                </p>
              )}
              {!serviceAreaStatus.available && (
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "1rem" }}>
                  <button className="btn btn--ghost btn--small" onClick={onCancelAppointmentType}>
                    Switch to Visit LG CUT
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>🏪</div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", marginBottom: "0.75rem", color: "var(--black)" }}>
            {locations.find((l) => l.id === booking.locationId)?.name || "LG CUT — FUNAAB"}
          </h3>
        </div>
      )}

      {/* Next button: always for visit, only when available for home */}
      {booking.appointmentType === "visit" && (
        <button className="btn btn--primary address-step__next" onClick={onNext}>
          Continue to Service
        </button>
      )}
      {isHome && serviceAreaStatus?.available && (
        <button className="btn btn--primary address-step__next" onClick={onNext}>
          Continue to Service
        </button>
      )}
    </div>
  );
}

/* ===== Service Step ===== */
function ServiceStep({ booking, services, addOns, priceInfo, onServiceSelect, onAddOnToggle, onNext }) {
  const canProceed = booking.serviceId !== null;
  const selectedAddOnIds = booking.addOnIds || [];
  const addOnsRef = useRef(null);

  // The custom fallback isn't a real photographed style — hide it from the list.
  const selectableServices = services.filter((s) => !s.isCustom);

  // When a style is chosen, bring the add-ons / price into view so the
  // customer sees the dye/tint option and the updated total.
  useEffect(() => {
    if (booking.serviceId) {
      scrollToElement(addOnsRef.current, 100);
    }
  }, [booking.serviceId]);

  return (
    <div>
      {booking.serviceId === "custom" && booking.customStyleName && (
        <div className="custom-style-note">
          Booking your custom style: <strong>{booking.customStyleName}</strong>
        </div>
      )}
      <div className="service-list">
        {selectableServices.map((service) => (
          <button
            key={service.id}
            className={`service-option ${booking.serviceId === service.id ? "selected" : ""}`}
            onClick={() => onServiceSelect(service.id)}
          >
            <div className="service-option__image">
              <img src={service.image} alt={service.name} loading="lazy" decoding="async" />
            </div>
            <div className="service-option__content">
              <div className="service-option__name">{service.name}</div>
              <div className="service-option__meta">
                <span>{service.duration} min</span>
                <span className="service-option__price price">
                  Visit ₦{service.visitPrice.toLocaleString()} · Home ₦{service.homePrice.toLocaleString()}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Add-ons appear once a style is chosen */}
      {canProceed && addOns && addOns.length > 0 && (
        <div className="add-ons" ref={addOnsRef}>
          <div className="add-ons__title">Add a finish (optional)</div>
          <div className="add-ons__list">
            {addOns.map((addOn) => {
              const selected = selectedAddOnIds.includes(addOn.id);
              return (
                <button
                  key={addOn.id}
                  type="button"
                  className={`add-on ${selected ? "selected" : ""}`}
                  onClick={() => onAddOnToggle(addOn.id)}
                  aria-pressed={selected}
                >
                  <span className="add-on__check" aria-hidden="true">
                    {selected ? "✓" : "+"}
                  </span>
                  <span className="add-on__body">
                    <span className="add-on__name">{addOn.name}</span>
                    <span className="add-on__desc">{addOn.description}</span>
                  </span>
                  <span className="add-on__price">+ ₦{addOn.price.toLocaleString()}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {priceInfo && (
        <div className="price-summary">
          <div className="price-summary__row">
            <span className="price-summary__label">Base Price</span>
            <span className="price-summary__value">₦{priceInfo.basePrice.toLocaleString()}</span>
          </div>
          {priceInfo.locationAdjustment > 0 && (
            <div className="price-summary__row">
              <span className="price-summary__label">Location Adjustment</span>
              <span className="price-summary__value">+ ₦{priceInfo.locationAdjustment.toLocaleString()}</span>
            </div>
          )}
          {priceInfo.travelFee > 0 && (
            <div className="price-summary__row">
              <span className="price-summary__label">Travel Fee</span>
              <span className="price-summary__value">+ ₦{priceInfo.travelFee.toLocaleString()}</span>
            </div>
          )}
          {(priceInfo.addOns || []).map((addOn) => (
            <div className="price-summary__row" key={addOn.id}>
              <span className="price-summary__label">{addOn.name}</span>
              <span className="price-summary__value">+ ₦{addOn.price.toLocaleString()}</span>
            </div>
          ))}
          <div className="price-summary__row price-summary__row--total">
            <span className="price-summary__label">Total</span>
            <span className="price-summary__value price-summary__total">₦{priceInfo.totalPrice.toLocaleString()}</span>
          </div>
        </div>
      )}
      {canProceed && (
        <button className="btn btn--primary service-step__next" onClick={onNext}>
          Continue to Date & Time
        </button>
      )}
    </div>
  );
}

/* ===== Date Time Step ===== */
function DateTimeStep({ booking, availability, onDateSelect, onTimeSelect, onNext }) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [availableDates, setAvailableDates] = useState(null);
  const timeSlotsRef = useRef(null);

  useEffect(() => {
    let active = true;
    getAvailableDates().then((result) => {
      if (active) setAvailableDates(result.dates);
    });
    return () => { active = false; };
  }, []);

  // When a date is picked (and its times have loaded), scroll the time slots
  // into view so the customer immediately sees what to choose next.
  useEffect(() => {
    if (booking.date && !availability.loading) {
      scrollToElement(timeSlotsRef.current, 100);
    }
  }, [booking.date, availability.loading]);

  const today = new Date();
  const maxWindowDays = businessConfig.maxBookingWindow;
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + maxWindowDays);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const fullDayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Get working hours for a given date
  const getWorkingHours = (dateStr) => {
    const dateObj = new Date(dateStr + "T00:00:00");
    const dayOfWeek = dateObj.getDay();
    const dayName = fullDayNames[dayOfWeek].toLowerCase();
    // Use location-specific hours if available, otherwise fall back to global working hours
    const location = locations.find((l) => l.id === booking.locationId);
    const hours = location ? location.openingHours[dayName] : businessConfig.workingHours[dayName];
    return hours || null;
  };

  const generateDays = () => {
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, date: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dateObj = new Date(currentYear, currentMonth, d);
      const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isBeyondWindow = dateObj > maxDate;
      const hours = getWorkingHours(dateStr);
      const isClosed = !hours || hours.closed;
      days.push({ day: d, date: dateStr, isPast, isBlocked: false, isBeyondWindow, isClosed });
    }
    return days;
  };

  const days = generateDays();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const canProceed = booking.date && booking.time;

  // Format selected date for display
  const formatSelectedDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  // Get working hours string for selected date
  const getHoursString = (dateStr) => {
    const hours = getWorkingHours(dateStr);
    if (!hours || hours.closed) return "Closed";
    return `${hours.open} – ${hours.close}`;
  };

  return (
    <div>
      <div className="date-picker">
        <div className="date-picker__month">
          <button className="date-picker__nav-btn" onClick={handlePrevMonth}>‹</button>
          <span className="date-picker__month-name">{monthNames[currentMonth]} {currentYear}</span>
          <button className="date-picker__nav-btn" onClick={handleNextMonth}>›</button>
        </div>
        <div className="date-picker__grid">
          {dayNames.map((name) => (
            <div key={name} className="date-picker__day-name">{name}</div>
          ))}
          {days.map((day, idx) => (
            <button
              key={idx}
              className={`date-picker__day ${day.date === booking.date ? "selected" : ""} ${day.isPast || day.isBlocked || day.isBeyondWindow || day.isClosed || !day.date || availableDates === null || !availableDates.includes(day.date) ? "disabled" : ""}`}
              disabled={day.isPast || day.isBlocked || day.isBeyondWindow || day.isClosed || !day.date || availableDates === null || !availableDates.includes(day.date)}
              onClick={() => onDateSelect(day.date)}
            >
              {day.day}
            </button>
          ))}
        </div>
      </div>

      {availableDates === null && (
        <p className="date-picker__availability-note">Loading available dates...</p>
      )}

      {booking.date && (
        <div className="date-picker__selected-preview">
          <div className="date-picker__selected-day">{formatSelectedDate(booking.date)}</div>
          <div className="date-picker__selected-hours">Working hours: {getHoursString(booking.date)}</div>
        </div>
      )}

      {booking.date && (
        <div className="time-slots" ref={timeSlotsRef}>
          <div className="time-slots__label">Available Times</div>
          {availability.loading ? (
            <div className="booking__loading">
              <div className="booking__loading-spinner"></div>
              <p>Loading available times...</p>
            </div>
          ) : availability.message ? (
            <p style={{ color: "var(--muted)", textAlign: "center", padding: "1.5rem" }}>{availability.message}</p>
          ) : (
            <>
              <div className="time-slots__grid">
                {availability.slots.map((slot) => (
                  <button
                    key={slot.id || slot.time}
                    className={`time-slot ${slot.status === "available" ? "" : slot.status === "too-soon" ? "too-soon" : slot.status === "past" ? "past" : slot.status === "booked" ? "booked" : "unavailable"} ${booking.time === slot.time ? "selected" : ""}`}
                    disabled={slot.status !== "available"}
                    onClick={() => onTimeSelect(slot)}
                  >
                    {slot.display}
                  </button>
                ))}
              </div>
              <div className="time-slots__legend">
                <span className="time-slots__legend-item">
                  <span className="time-slots__legend-dot available"></span> Available
                </span>
                <span className="time-slots__legend-item">
                  <span className="time-slots__legend-dot selected"></span> Selected
                </span>
                <span className="time-slots__legend-item">
                  <span className="time-slots__legend-dot too-soon"></span> Too soon
                </span>
                <span className="time-slots__legend-item">
                  <span className="time-slots__legend-dot booked"></span> Booked
                </span>
                <span className="time-slots__legend-item">
                  <span className="time-slots__legend-dot unavailable"></span> Unavailable
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {canProceed && (
        <button className="btn btn--primary datetime-step__next" onClick={onNext}>
          Continue to Customer Details
        </button>
      )}
    </div>
  );
}

/* ===== Customer Details Step ===== */
function CustomerDetailsStep({ booking, updateBooking, onNext }) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!booking.customerName.trim()) {
      newErrors.customerName = "Please enter your full name.";
    }
    if (!booking.customerPhone.trim()) {
      newErrors.customerPhone = "Please enter your phone number.";
    }
    if (!booking.customerEmail.trim()) {
      newErrors.customerEmail = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.customerEmail)) {
      newErrors.customerEmail = "Please enter a valid email address.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const canProceed = booking.customerName && booking.customerPhone && booking.customerEmail;

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const isHome = booking.appointmentType === "home";

  return (
    <div>
      <div className="customer-details__grid">
        <div className="customer-details__field">
          <label className="customer-details__label">Full Name</label>
          <input
            type="text"
            className={`customer-details__input ${errors.customerName ? "error" : ""}`}
            placeholder="e.g. Tayo Adeyemi"
            value={booking.customerName}
            onChange={(e) => {
              updateBooking("customerName", e.target.value);
              if (errors.customerName) setErrors({ ...errors, customerName: null });
            }}
          />
          {errors.customerName && <span className="customer-details__error">{errors.customerName}</span>}
        </div>
        <div className="customer-details__field">
          <label className="customer-details__label">Phone Number</label>
          <input
            type="tel"
            className={`customer-details__input ${errors.customerPhone ? "error" : ""}`}
            placeholder="e.g. +234 800 000 0000"
            value={booking.customerPhone}
            onChange={(e) => {
              updateBooking("customerPhone", e.target.value);
              if (errors.customerPhone) setErrors({ ...errors, customerPhone: null });
            }}
          />
          {errors.customerPhone && <span className="customer-details__error">{errors.customerPhone}</span>}
        </div>
        <div className="customer-details__field full-width">
          <label className="customer-details__label">Email Address</label>
          <input
            type="email"
            className={`customer-details__input ${errors.customerEmail ? "error" : ""}`}
            placeholder="e.g. tayo@example.com"
            value={booking.customerEmail}
            onChange={(e) => {
              updateBooking("customerEmail", e.target.value);
              if (errors.customerEmail) setErrors({ ...errors, customerEmail: null });
            }}
          />
          {errors.customerEmail && <span className="customer-details__error">{errors.customerEmail}</span>}
        </div>
        <div className="customer-details__field full-width">
          <label className="customer-details__label">Notes (Optional)</label>
          <textarea
            className="customer-details__input customer-details__textarea"
            placeholder="Anything we should know? e.g. preferred clipper guard, allergies, etc."
            rows="3"
            value={booking.notes}
            onChange={(e) => updateBooking("notes", e.target.value)}
          />
        </div>
      </div>
      <button
        className="btn btn--primary customer-details__next"
        onClick={handleNext}
        disabled={!canProceed}
      >
        Continue to Review
      </button>
    </div>
  );
}

/* ===== Review Step ===== */
function ReviewStep({ booking, priceInfo, serviceAreaStatus, locations, services, onConfirm, onEdit, bookingError }) {
  const [loading, setLoading] = useState(false);

  const service = services.find((s) => s.id === booking.serviceId);
  const location = locations.find((l) => l.id === booking.locationId);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  };

  const handleEdit = (step) => {
    onEdit(step);
  };

  return (
    <div>
      <div className="review__brand">
        <LogoMark size={34} tone="dark" />
        <span className="review__brand-logo">LG CUT</span>
        <span className="review__brand-tag">Appointment Summary</span>
      </div>

      <div className="review__summary">
        <div className="review__group">
          <div className="review__group-title">
            <span>Service</span>
            <button className="review__edit-link" onClick={() => handleEdit("service")}>Edit</button>
          </div>
          {service && (
            <div className="review__row">
              <span className="review__label">Service</span>
              <span className="review__value">{booking.customStyleName || service.name}</span>
            </div>
          )}
          {service && (
            <div className="review__row">
              <span className="review__label">Duration</span>
              <span className="review__value">{service.duration} min</span>
            </div>
          )}
          {(priceInfo?.addOns || []).length > 0 && (
            <div className="review__row">
              <span className="review__label">Add-ons</span>
              <span className="review__value">
                {priceInfo.addOns.map((a) => a.name).join(", ")}
              </span>
            </div>
          )}
          <div className="review__row">
            <span className="review__label">Appointment Type</span>
            <span className="review__value">
              {booking.appointmentType === "visit" ? "Visit LG CUT" : "Home Service"}
            </span>
          </div>
        </div>

        <div className="review__group">
          <div className="review__group-title">
            <span>Where</span>
            <button className="review__edit-link" onClick={() => handleEdit("location")}>Edit</button>
          </div>
          {booking.appointmentType === "visit" && location && (
            <div className="review__row">
              <span className="review__label">Location</span>
              <span className="review__value">{location.name}</span>
            </div>
          )}
          {booking.appointmentType === "home" && serviceAreaStatus?.zone && (
            <div className="review__row">
              <span className="review__label">Service Zone</span>
              <span className="review__value">{serviceAreaStatus.zone.name}</span>
            </div>
          )}
          {booking.appointmentType === "home" && serviceAreaStatus?.estimatedTravelTime && (
            <div className="review__row">
              <span className="review__label">Estimated Travel</span>
              <span className="review__value">{serviceAreaStatus.estimatedTravelTime}</span>
            </div>
          )}
        </div>

        <div className="review__group">
          <div className="review__group-title">
            <span>When</span>
            <button className="review__edit-link" onClick={() => handleEdit("datetime")}>Edit</button>
          </div>
          <div className="review__row">
            <span className="review__label">Date</span>
            <span className="review__value">{formatDate(booking.date)}</span>
          </div>
          <div className="review__row">
            <span className="review__label">Time</span>
            <span className="review__value">{booking.time ? formatTime(booking.time) : ""}</span>
          </div>
        </div>

        <div className="review__group">
          <div className="review__group-title">
            <span>Customer</span>
            <button className="review__edit-link" onClick={() => handleEdit("customer")}>Edit</button>
          </div>
          <div className="review__row">
            <span className="review__label">Name</span>
            <span className="review__value">{booking.customerName}</span>
          </div>
          <div className="review__row">
            <span className="review__label">Phone</span>
            <span className="review__value">{booking.customerPhone}</span>
          </div>
          <div className="review__row">
            <span className="review__label">Email</span>
            <span className="review__value review__value--small">{booking.customerEmail}</span>
          </div>
          {booking.notes && (
            <div className="review__row">
              <span className="review__label">Notes</span>
              <span className="review__value review__value--small">{booking.notes}</span>
            </div>
          )}
        </div>

        {priceInfo && (
          <div className="review__group">
            <div className="review__group-title">Price</div>
            <div className="review__row">
              <span className="review__label">Service Price</span>
              <span className="review__value">₦{priceInfo.basePrice.toLocaleString()}</span>
            </div>
            {priceInfo.locationAdjustment > 0 && (
              <div className="review__row">
                <span className="review__label">Location Adjustment</span>
                <span className="review__value">+ ₦{priceInfo.locationAdjustment.toLocaleString()}</span>
              </div>
            )}
            {priceInfo.travelFee > 0 && (
              <div className="review__row">
                <span className="review__label">Travel Fee</span>
                <span className="review__value">+ ₦{priceInfo.travelFee.toLocaleString()}</span>
              </div>
            )}
            {(priceInfo.addOns || []).map((addOn) => (
              <div className="review__row" key={addOn.id}>
                <span className="review__label">{addOn.name}</span>
                <span className="review__value">+ ₦{addOn.price.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="review__total">
        <span className="review__total-label">TOTAL</span>
        <span className="review__total-value">
          ₦{priceInfo?.totalPrice.toLocaleString()}
        </span>
      </div>

      {bookingError && (
        <div className="review__error" role="alert">
          {bookingError}
        </div>
      )}

      <div className="review__actions">
        <button
          className="btn btn--primary"
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? "Confirming..." : "Confirm Booking"}
        </button>
      </div>
    </div>
  );
}

/* ===== Booking Summary (Sticky Sidebar) ===== */
function BookingSummary({ booking, priceInfo, serviceAreaStatus, locations, services }) {
  const service = services.find((s) => s.id === booking.serviceId);
  const location = locations.find((l) => l.id === booking.locationId);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  };

  return (
    <aside className="booking-summary">
      <div className="booking-summary__content">
        <h3 className="booking-summary__title">Your Booking</h3>

        <div className="booking-summary__section">
          <div className="booking-summary__row">
            <span className="booking-summary__label">Type</span>
            <span className="booking-summary__value">
              {booking.appointmentType === "visit" ? "Visit LG CUT" : "Home Service"}
            </span>
          </div>

          {booking.appointmentType === "visit" && location && (
            <div className="booking-summary__row">
              <span className="booking-summary__label">Location</span>
              <span className="booking-summary__value booking-summary__value--small">
                {location.name}
              </span>
            </div>
          )}

          {service && (
            <div className="booking-summary__row">
              <span className="booking-summary__label">Service</span>
              <span className="booking-summary__value">{booking.customStyleName || service.name}</span>
            </div>
          )}

          {booking.date && (
            <div className="booking-summary__row">
              <span className="booking-summary__label">Date</span>
              <span className="booking-summary__value">{formatDate(booking.date)}</span>
            </div>
          )}

          {booking.time && (
            <div className="booking-summary__row">
              <span className="booking-summary__label">Time</span>
              <span className="booking-summary__value">{formatTime(booking.time)}</span>
            </div>
          )}

          {booking.customerName && (
            <div className="booking-summary__row">
              <span className="booking-summary__label">Customer</span>
              <span className="booking-summary__value booking-summary__value--small">
                {booking.customerName}
              </span>
            </div>
          )}
        </div>

        {priceInfo && (
          <div className="booking-summary__price">
            <div className="booking-summary__row">
              <span className="booking-summary__label">Base Price</span>
              <span className="booking-summary__value">₦{priceInfo.basePrice.toLocaleString()}</span>
            </div>
            {priceInfo.locationAdjustment > 0 && (
              <div className="booking-summary__row">
                <span className="booking-summary__label">Location Adjustment</span>
                <span className="booking-summary__value">+ ₦{priceInfo.locationAdjustment.toLocaleString()}</span>
              </div>
            )}
            {priceInfo.travelFee > 0 && (
              <div className="booking-summary__row">
                <span className="booking-summary__label">Travel Fee</span>
                <span className="booking-summary__value">+ ₦{priceInfo.travelFee.toLocaleString()}</span>
              </div>
            )}
            {(priceInfo.addOns || []).map((addOn) => (
              <div className="booking-summary__row" key={addOn.id}>
                <span className="booking-summary__label">{addOn.name}</span>
                <span className="booking-summary__value">+ ₦{addOn.price.toLocaleString()}</span>
              </div>
            ))}
            <div className="booking-summary__total">
              <span className="booking-summary__total-label">TOTAL</span>
              <span className="booking-summary__total-value">
                ₦{priceInfo.totalPrice.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ===== Confirmation Step ===== */
function ConfirmationStep({ bookingResult, booking, priceInfo, serviceAreaStatus, locations, services, notificationStatus, onNewBooking, onBackHome }) {
  const [copied, setCopied] = useState(false);

  const service = services.find((s) => s.id === booking.serviceId);
  const location = locations.find((l) => l.id === booking.locationId);
  const bookingId = bookingResult?.bookingId || "";
  // Backend is the source of truth for the final price.
  const finalPrice = bookingResult?.price ?? priceInfo?.totalPrice ?? 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(bookingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleAddToCalendar = () => {
    if (!booking.date || !booking.time) return;
    const start = new Date(`${booking.date}T${booking.time}:00`);
    const end = new Date(start.getTime() + (service?.duration || 45) * 60000);
    const fmt = (d) =>
      d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const title = encodeURIComponent(`LG CUT — ${booking.customStyleName || service?.name || "Appointment"}`);
    const details = encodeURIComponent(
      `Appointment with LG CUT.\nBooking ID: ${bookingId}\n${booking.appointmentType === "home" ? "Home Service" : "Visit LG CUT"}`
    );
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${details}`;
    window.open(url, "_blank");
  };

  return (
    <div className="confirmation">
      <div className="confirmation__icon">✓</div>
      <h2 className="confirmation__title">You're booked.</h2>
      <p className="confirmation__subtitle">
        Your appointment is confirmed. We've received your booking and our team will be in touch.
      </p>

      {notificationStatus && notificationStatus.success === false && !notificationStatus.skipped && (
        <div className="confirmation__notice" role="alert">
          Your booking was created successfully, but we couldn't deliver the notification to our team.
          Please keep your booking reference below — our team will still receive your appointment.
        </div>
      )}

      <div className="confirmation__id-block">
        <span className="confirmation__id-label">Booking ID</span>
        <div className="confirmation__booking-id">{bookingId}</div>
        <button className="confirmation__copy-btn" onClick={handleCopyId}>
          {copied ? "✓ Copied!" : "Copy Booking ID"}
        </button>
      </div>

      <div className="confirmation__card">
        <div className="confirmation__row">
          <span className="confirmation__label">Service</span>
          <span className="confirmation__value">{booking.customStyleName || service?.name}</span>
        </div>
        <div className="confirmation__row">
          <span className="confirmation__label">Appointment Type</span>
          <span className="confirmation__value">
            {booking.appointmentType === "visit" ? "Visit LG CUT" : "Home Service"}
          </span>
        </div>
        <div className="confirmation__row">
          <span className="confirmation__label">Date</span>
          <span className="confirmation__value">{formatDate(booking.date)}</span>
        </div>
        <div className="confirmation__row">
          <span className="confirmation__label">Time</span>
          <span className="confirmation__value">{booking.time ? formatTime(booking.time) : ""}</span>
        </div>
        {booking.appointmentType === "visit" && location && (
          <div className="confirmation__row">
            <span className="confirmation__label">Location</span>
            <span className="confirmation__value">{location.name}</span>
          </div>
        )}
        {booking.appointmentType === "home" && serviceAreaStatus?.zone && (
          <div className="confirmation__row">
            <span className="confirmation__label">Service Zone</span>
            <span className="confirmation__value">{serviceAreaStatus.zone.name}</span>
          </div>
        )}
        <div className="confirmation__row">
          <span className="confirmation__label">Duration</span>
          <span className="confirmation__value">{service?.duration} min</span>
        </div>
        {(priceInfo?.addOns || []).length > 0 && (
          <div className="confirmation__row">
            <span className="confirmation__label">Add-ons</span>
            <span className="confirmation__value">
              {priceInfo.addOns.map((a) => a.name).join(", ")}
            </span>
          </div>
        )}
        <div className="confirmation__row">
          <span className="confirmation__label">Customer</span>
          <span className="confirmation__value">{booking.customerName}</span>
        </div>
        <div className="confirmation__row confirmation__row--total">
          <span className="confirmation__label">Total</span>
          <span className="confirmation__value confirmation__value--total">
            ₦{finalPrice.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="confirmation__actions">
        <button className="btn btn--secondary" onClick={handleAddToCalendar}>
          Add to Calendar
        </button>
        <button className="btn btn--gold" onClick={onNewBooking}>
          Book Another
        </button>
        <button className="btn btn--ghost" onClick={onBackHome}>
          Back Home
        </button>
      </div>
    </div>
  );
}

export default App;
