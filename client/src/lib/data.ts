import heroImage from "@assets/generated_images/futuristic_electronics_hero_banner.png";
import aboutImage from "@assets/generated_images/modern_tech_office_for_about_section.png";
import phoneImage from "@assets/generated_images/futuristic_smartphone_product_shot.png";
import headphoneImage from "@assets/generated_images/premium_headphones_product_shot.png";
import watchImage from "@assets/generated_images/next-gen_smartwatch_product_shot.png";
import laptopImage from "@assets/generated_images/slim_gaming_laptop_product_shot.png";

// New images
import phoneSide from "@assets/generated_images/smartphone_side_view.png";
import phoneBack from "@assets/generated_images/smartphone_back_view.png";
import headphoneFolded from "@assets/generated_images/headphones_folded.png";
import headphoneLife from "@assets/generated_images/headphones_lifestyle.png";
import watchUI from "@assets/generated_images/smartwatch_ui_close_up.png";
import watchWrist from "@assets/generated_images/smartwatch_on_wrist.png";
import laptopKeyboard from "@assets/generated_images/laptop_keyboard.png";
import laptopClosed from "@assets/generated_images/laptop_closed.png";

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  images: string[];
  category: string;
  rating: number;
  description: string;
  longDescription: string;
  specs: string[];
  originalPrice?: number;
  discountPercent?: number;
  discountedPrice?: number;
  benefits?: string[];
}

export const products: Product[] = [
  {
    id: 1,
    name: "Nova X1 Smartphone",
    price: 999,
    originalPrice: 999,
    discountPercent: 50,
    discountedPrice: Math.round(999 * 0.5),
    benefits: ["2 Year Warranty", "Free Shipping", "30 Day Returns"],
    image: phoneImage,
    images: [phoneImage, phoneSide, phoneBack],
    category: "Mobile",
    rating: 4.8,
    description: "Holographic edge display with quantum processing power.",
    longDescription: "The Nova X1 redefines mobile computing with its bezel-less holographic edge display. Powered by the Quantum Snapdragon 9 processor, it delivers instant AI responses and immersive AR experiences. The matte black finish absorbs 99% of light, giving it a stealthy, premium look.",
    specs: ["6.8\" Holographic AMOLED", "Quantum Snapdragon 9", "12GB RAM / 512GB Storage", "108MP Neural Camera"],
  },
  {
    id: 2,
    name: "Sonic Flow Headphones",
    price: 349,
    originalPrice: 349,
    discountPercent: 50,
    discountedPrice: Math.round(349 * 0.5),
    benefits: ["2 Year Warranty", "Free Shipping", "30 Day Returns"],
    image: headphoneImage,
    images: [headphoneImage, headphoneFolded, headphoneLife],
    category: "Audio",
    rating: 4.9,
    description: "Adaptive noise cancellation with neural audio enhancement.",
    longDescription: "Experience sound in its purest form. Sonic Flow headphones use real-time neural processing to adapt audio profiles to your specific ear shape and environment. The glowing earcups visualize the rhythm of your music.",
    specs: ["Neural ANC 2.0", "40h Battery Life", "Lossless Wireless Audio", "Reactive RGB Lighting"],
  },
  {
    id: 3,
    name: "Chronos Smartwatch",
    price: 499,
    originalPrice: 499,
    discountPercent: 50,
    discountedPrice: Math.round(499 * 0.5),
    benefits: ["2 Year Warranty", "Free Shipping", "30 Day Returns"],
    image: watchImage,
    images: [watchImage, watchUI, watchWrist],
    category: "Wearables",
    rating: 4.7,
    description: "Biometric health tracking projected directly on your skin.",
    longDescription: "Chronos isn't just a watch; it's a health guardian. It projects vital stats directly onto your wrist using a safe, low-power laser interface, freeing you from screens. The titanium chassis is virtually indestructible.",
    specs: ["Holographic Projection UI", "Titanium Body", "7-Day Battery", "Full Biometric Suite"],
  },
  {
    id: 4,
    name: "Blade Runner Laptop",
    price: 2499,
    originalPrice: 2499,
    discountPercent: 50,
    discountedPrice: Math.round(2499 * 0.5),
    benefits: ["2 Year Warranty", "Free Shipping", "30 Day Returns"],
    image: laptopImage,
    images: [laptopImage, laptopKeyboard, laptopClosed],
    category: "Computing",
    rating: 5.0,
    description: "Desktop power in a wafer-thin chassis with RGB aura.",
    longDescription: "The Blade Runner is the thinnest gaming laptop ever created. Despite its size, it packs a desktop-class GPU and a liquid cooling system that defies physics. The RGB aura lighting syncs with your gameplay for total immersion.",
    specs: ["RTX 5090 Mobile", "i9-14900HK", "4K 240Hz OLED", "MagLev Keyboard"],
  },
];

export const assets = {
  hero: heroImage,
  about: aboutImage,
};
