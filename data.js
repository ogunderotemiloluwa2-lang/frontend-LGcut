// LG CUT — Mock Data
// All data-driven content for the barber booking application

export const businessConfig = {
  name: "LG CUT",
  tagline: "Your cut. Your time.",
  description: "Premium barbering around FUNAAB and Abeokuta. We come to you or you visit us — either way, you leave sharper than you arrived.",
  phone: "08141255405",
  whatsappNumber: "08141255405",
  whatsappLink: "https://wa.me/2348141255405",
  email: "hello@lgcut.com",
  timezone: "Africa/Lagos",
  minNotice: {
    visit: 0, // hours
    home: 0, // hours
  },
  maxBookingWindow: 30, // days
  bufferTime: 15, // minutes
  travelBuffer: 30, // minutes for home service (fallback if zone travel time not set)
  // The barber works every day, 10:00 – 18:00. No closed days.
  workingHours: {
    monday: { open: "10:00", close: "18:00", closed: false },
    tuesday: { open: "10:00", close: "18:00", closed: false },
    wednesday: { open: "10:00", close: "18:00", closed: false },
    thursday: { open: "10:00", close: "18:00", closed: false },
    friday: { open: "10:00", close: "18:00", closed: false },
    saturday: { open: "10:00", close: "18:00", closed: false },
    sunday: { open: "10:00", close: "18:00", closed: false },
  },
};

export const locations = [
  {
    id: "funaab",
    name: "LG CUT — FUNAAB",
    address: "Shop 12, Alabata Commercial Complex, along Olabisi Onabanjo Way",
    area: "Alabata",
    city: "FUNAAB",
    state: "Ogun State",
    fullAddress: "Shop 12, Alabata Commercial Complex, along Olabisi Onabanjo Way, Alabata, FUNAAB, Ogun State",
    phone: "08141255405",
    email: "funaab@lgcut.com",
    openingHours: {
      monday: { open: "10:00", close: "18:00", closed: false },
      tuesday: { open: "10:00", close: "18:00", closed: false },
      wednesday: { open: "10:00", close: "18:00", closed: false },
      thursday: { open: "10:00", close: "18:00", closed: false },
      friday: { open: "10:00", close: "18:00", closed: false },
      saturday: { open: "10:00", close: "18:00", closed: false },
      sunday: { open: "10:00", close: "18:00", closed: false },
    },
    priceAdjustment: 0,
    image: "/images/pexels-rdne-7697226.jpg",
  },
  {
    id: "abeokuta",
    name: "LG CUT — Central Abeokuta",
    address: "Suite B, Grandview Plaza, opposite GLO Office, Wetherell-David Road",
    area: "Ibara",
    city: "Abeokuta",
    state: "Ogun State",
    fullAddress: "Suite B, Grandview Plaza, opposite GLO Office, Wetherell-David Road, Ibara, Abeokuta, Ogun State",
    phone: "+234 800 000 0001",
    email: "abeokuta@lgcut.com",
    openingHours: {
      monday: { open: "10:00", close: "18:00", closed: false },
      tuesday: { open: "10:00", close: "18:00", closed: false },
      wednesday: { open: "10:00", close: "18:00", closed: false },
      thursday: { open: "10:00", close: "18:00", closed: false },
      friday: { open: "10:00", close: "18:00", closed: false },
      saturday: { open: "10:00", close: "18:00", closed: false },
      sunday: { open: "10:00", close: "18:00", closed: false },
    },
    priceAdjustment: 0,
    image: "/images/pexels-esra-erdogdu-1501957338-32847602.jpg",
  },
];

export const services = [
  {
    id: "fade",
    name: "Fade",
    description: "A clean, blended fade — skin-close at the sides and back, tapering neatly into the top. Any height (low, mid, high, drop, bald) is the same price.",
    duration: 45,
    basePrice: 4000,
    visitPrice: 4000,
    homePrice: 4000,
    category: "Hair",
    image: "/images/style-fade.jpg",
  },
  {
    id: "afro",
    name: "Afro",
    description: "Precision shaping and detailing for natural afro texture, keeping it defined, rounded and tidy.",
    duration: 35,
    basePrice: 4000,
    visitPrice: 4000,
    homePrice: 4000,
    category: "Hair",
    image: "/images/style-afro.jpg",
  },
  {
    id: "low-cut",
    name: "Low Cut",
    description: "A neat, uniform low cut clipped close all over — clean, sharp and low-maintenance.",
    duration: 30,
    basePrice: 4000,
    visitPrice: 4000,
    homePrice: 4000,
    category: "Hair",
    image: "/images/style-low-cut.jpg",
  },
  {
    id: "waves",
    name: "Waves",
    description: "Specialized cutting and brushing technique to enhance and maintain your 360 wave pattern.",
    duration: 50,
    basePrice: 4000,
    visitPrice: 4000,
    homePrice: 4000,
    category: "Hair",
    image: "/images/style-waves.jpg",
  },
  {
    id: "cornrows",
    name: "Cornrows",
    description: "Neat rows braided close to the scalp in your chosen pattern. Price is the same however full the style.",
    duration: 60,
    basePrice: 4000,
    visitPrice: 4000,
    homePrice: 4000,
    category: "Hair",
    image: "/images/style-cornrows.jpg",
  },
  {
    id: "sponge-twists",
    name: "Sponge Twists",
    description: "Defined coils created with a sponge for natural textured hair — soft, springy and full.",
    duration: 45,
    basePrice: 4000,
    visitPrice: 4000,
    homePrice: 4000,
    category: "Hair",
    image: "/images/style-sponge-twists.jpg",
  },
  {
    id: "line-up",
    name: "Line Up",
    description: "Crisp edge-up along the hairline and temples to sharpen your look.",
    duration: 20,
    basePrice: 4000,
    visitPrice: 4000,
    homePrice: 4000,
    category: "Hair",
    image: "/images/style-line-up.jpg",
  },
  {
    id: "textured-crop",
    name: "Textured Crop",
    description: "A short, choppy top with a soft fade for a relaxed, modern finish.",
    duration: 40,
    basePrice: 4000,
    visitPrice: 4000,
    homePrice: 4000,
    category: "Hair",
    image: "/images/style-textured-crop.jpg",
  },
  {
    id: "natural-afro",
    name: "Natural Afro Reference",
    description: "A natural afro with dense, rounded curls and a clean shape.",
    duration: 35,
    basePrice: 4000,
    visitPrice: 4000,
    homePrice: 4000,
    category: "Hair",
    image: "/images/style-afro-new.jpg",
  },
  {
    id: "360-waves",
    name: "360 Waves Reference",
    description: "Defined wave pattern brushed around the head with a clean finish.",
    duration: 50,
    basePrice: 4000,
    visitPrice: 4000,
    homePrice: 4000,
    category: "Hair",
    image: "/images/style-waves-new.jpg",
  },
  {
    id: "low-cut-fade",
    name: "Low Cut Fade",
    description: "A clean low cut with a sharp fade and crisp line-up — neat, low-maintenance and always fresh.",
    duration: 35,
    basePrice: 4000,
    visitPrice: 4000,
    homePrice: 4000,
    category: "Hair",
    image: "/images/style-low-cut-fade.jpg",
  },
  {
    id: "leopard-dye",
    name: "Leopard Print Dye",
    description: "Bold leopard-spot pattern dyed into the hair — a statement colour job with pink and black detailing.",
    duration: 90,
    basePrice: 15000,
    visitPrice: 15000,
    homePrice: 15000,
    category: "Hair",
    image: "/images/style-leopard-dye.jpg",
  },
  {
    id: "tinted-afro",
    name: "Tinted Afro",
    description: "A full afro coloured with a vibrant tint — rounded, defined and finished with a bold colour.",
    duration: 90,
    basePrice: 15000,
    visitPrice: 15000,
    homePrice: 15000,
    category: "Hair",
    image: "/images/style-tinted-afro.jpg",
  },
  {
    // Fallback for unique style names we don't have in the gallery. The client
    // types the name and we book it at a standard cut price.
    id: "custom",
    name: "Custom Style",
    description: "A style you name yourself — tell us the look and we'll cut it. Priced as a standard cut.",
    duration: 45,
    basePrice: 4000,
    visitPrice: 4000,
    homePrice: 4000,
    category: "Hair",
    image: "/images/style-textured-crop.jpg",
    isCustom: true,
  },
];

// Optional extras the customer can add to any service.
// The customer picks EITHER a dye OR a tint — they are separate options.
export const addOns = [
  {
    id: "dye",
    name: "Dye",
    description: "Add colour to your style.",
    price: 2000,
  },
  {
    id: "tint",
    name: "Tint",
    description: "Add a tint to your style.",
    price: 15000,
  },
];

export const pricingNote = "Haircut: ₦4,000. Dye: ₦2,000. Tint: ₦15,000. Final pricing may be agreed higher after an in-person consultation."

export const serviceZones = [
  {
    id: "funaab-alabata",
    name: "FUNAAB / Alabata",
    city: "FUNAAB",
    state: "Ogun State",
    maxDistance: 15, // km
    travelFee: 0,
    travelTimeMinutes: 20,
    estimatedTravelTime: "15–25 minutes",
    active: true,
  },
  {
    id: "central-abeokuta",
    name: "Central Abeokuta",
    city: "Abeokuta",
    state: "Ogun State",
    maxDistance: 20, // km
    travelFee: 0,
    travelTimeMinutes: 30,
    estimatedTravelTime: "25–40 minutes",
    active: true,
  },
  {
    id: "sagamu",
    name: "Sagamu",
    city: "Sagamu",
    state: "Ogun State",
    maxDistance: 25, // km
    travelFee: 0,
    travelTimeMinutes: 50,
    estimatedTravelTime: "40–60 minutes",
    active: true,
  },
];

// Price modifiers for appointment type
export const appointmentTypePricing = {
  visit: {
    label: "Visit LG CUT",
    description: "Come to our barbershop",
    priceModifier: 0,
  },
  home: {
    label: "Home Service",
    description: "We come to your location",
    priceModifier: 0, // home prices are now per-service in services[].homePrice
  },
};

// About / brand content
export const aboutContent = {
  headline: "Crafted for men who care about how they look.",
  body: "LG CUT was founded in 2023 by master barber Samuel Ogunleye, who spent a decade perfecting his craft in Lagos before returning to Ogun State to bring premium barbering to FUNAAB and Abeokta. Every cut is approached like a collaboration — we listen, we shape, and we refine until it's right.",
  philosophy: "We don't just cut hair. We craft confidence.",
  founder: "Samuel Ogunleye — Master Barber",
};

// Testimonials (realistic, not fake statistics)
export const testimonials = [
  {
    id: 1,
    name: "Tayo Adeyemi",
    role: "Student, FUNAAB",
    quote: "Best fade in Ogun State. Sam actually listens to what you want.",
    image: "/images/testimonial-tayo.jpg",
  },
  {
    id: 2,
    name: "Kunle Bakare",
    role: "Entrepreneur, Abeokuta",
    quote: "The home service saved me when I had back-to-back meetings. Sharp as always.",
    image: "/images/testimonial-kunle.jpg",
  },
];
