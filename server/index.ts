import express from "express";
import mongoose, { Schema, model } from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import { v2 as cloudinary } from "cloudinary";
import bcrypt from "bcryptjs";
// @ts-ignore
import jwt from "jsonwebtoken";
dotenv.config();

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(
  cors({
    origin: process.env.VERCEL ? true : [/http:\/\/localhost:5000$/, /http:\/\/127\.0\.0\.1:5000$/, /http:\/\/localhost:5001$/, /http:\/\/127\.0\.0\.1:5001$/, /http:\/\/localhost:5002$/, /http:\/\/127\.0\.0\.1:5002$/],
    credentials: true,
  })
);

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/Anvar_web";
mongoose.set("strictQuery", true);
mongoose
  .connect(mongoUri, { autoIndex: true })
  .then(() => {
    console.log("mongodb connected");
  })
  .catch((err) => {
    console.error("mongodb connection error:", err?.message || err);
  });

const ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    longDescription: { type: String },
    image: { type: String },
    images: [{ type: String }],
    category: { type: String },
    rating: { type: Number },
    originalPrice: { type: Number },
    discountPercent: { type: Number },
    discountedPrice: { type: Number },
    features: [{ type: String }],
    warranty2yr: { type: Boolean, default: false },
    freeShipping: { type: Boolean, default: false },
    thirtyDayReturns: { type: Boolean, default: false },
    warrantyText: { type: String },
    shippingText: { type: String },
    returnsText: { type: String },
  },
  { timestamps: true }
);
const Product = model("Product", ProductSchema);

const AdminSchema = new Schema(
  {
    email: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    resetCodeHash: { type: String },
    resetCodeExp: { type: Date },
  },
  { timestamps: true }
);
const Admin = model("Admin", AdminSchema);

const jwtSecret = process.env.JWT_SECRET || "dev_secret";

let wss: WebSocketServer | null = null;

async function ensureAdmin() {
  const admins = [
    { email: process.env.ADMIN_EMAIL || "raushankumar114122002@gmail.com", password: process.env.ADMIN_PASSWORD || "raushan@#123" },
    { email: "raushankumar112122002@gmail.com", password: process.env.ADMIN_PASSWORD || "raushan@#123" },
  ];
  for (const a of admins) {
    const found = await Admin.findOne({ email: a.email });
    if (!found) {
      const hash = await bcrypt.hash(a.password, 10);
      await Admin.create({ email: a.email, passwordHash: hash });
    }
  }
}
ensureAdmin().catch(() => {});

async function authAdmin(req: any, res: any, next: any) {
  try {
    const h = req.headers["authorization"] || "";
    const parts = String(h).split(" ");
    const token = parts.length === 2 ? parts[1] : "";
    if (!token) return res.status(401).send("unauthorized");
    const decoded: any = jwt.verify(token, jwtSecret);
    const adminId = decoded?.id ? String(decoded.id) : "";
    if (!adminId) return res.status(401).send("unauthorized");
    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(401).send("unauthorized");
    (req as any).adminId = adminId;
    next();
  } catch {
    return res.status(401).send("unauthorized");
  }
}
app.get("/admin/auth/me", authAdmin, async (req, res) => {
  res.json({ ok: true, id: (req as any).adminId });
});

  const OrderSchema = new Schema(
    {
    items: [
      {
        id: Number,
        name: String,
        price: Number,
        quantity: Number,
        image: String,
      },
    ],
    total: Number,
    customer: {
      name: String,
      email: String,
      address: String,
      details: String,
      desiredCount: Number,
      phone: String,
      locationLink: String,
    },
    status: { type: String, enum: ["pending", "on_the_way", "delivered"], default: "pending" },
  },
  { timestamps: true }
);
const Order = model("Order", OrderSchema);

const CounterSchema = new Schema(
  {
    key: { type: String, unique: true, required: true },
    count: { type: Number, default: 0 },
  },
  { timestamps: true }
);
const Counter = model("Counter", CounterSchema);

async function ensureVisitorsCounter() {
  try {
    await Counter.findOneAndUpdate(
      { key: "visitors" },
      { $setOnInsert: { count: 0 } },
      { upsert: true, new: true }
    );
  } catch {}
}
ensureVisitorsCounter().catch(() => {});

app.get("/track", async (_req, res) => {
  try {
    const c = await Counter.findOneAndUpdate(
      { key: "visitors" },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );
    const totalUsers = c?.count || 0;
    res.json({ ok: true, totalUsers });
    try { broadcast({ type: "users_count", totalUsers }); } catch {}
  } catch (e: any) {
    res.status(400).send(e?.message || "track failed");
  }
});

app.get("/admin/users-count", async (_req, res) => {
  try {
    const c = await Counter.findOne({ key: "visitors" });
    res.json({ totalUsers: c?.count || 0 });
  } catch {
    res.json({ totalUsers: 0 });
  }
});

app.post("/admin/add-product", authAdmin, async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      longDescription,
      images,
      category,
      rating,
      originalPrice,
      discountPercent,
      discountedPrice,
      features,
      warranty2yr,
      freeShipping,
      thirtyDayReturns,
      warrantyText,
      shippingText,
      returnsText,
    } = req.body;
    const image = Array.isArray(images) && images.length > 0 ? images[0] : undefined;
    const p = await Product.create({
      name,
      price,
      description,
      longDescription,
      image,
      images,
      category,
      rating,
      originalPrice,
      discountPercent,
      discountedPrice,
      features,
      warranty2yr,
      freeShipping,
      thirtyDayReturns,
      warrantyText,
      shippingText,
      returnsText,
    });
    try { broadcast({ type: "products_changed" }); } catch {}
    res.status(201).json(p);
  } catch (e: any) {
    res.status(400).send(e?.message || "bad request");
  }
});

app.get("/admin/products", async (_req, res) => {
  const list = await Product.find().sort({ createdAt: -1 });
  res.json(list);
});

app.delete("/admin/product/:id", authAdmin, async (req, res) => {
  const { id } = req.params;
  const r = await Product.findByIdAndDelete(id);
  if (!r) return res.status(404).send("not found");
  try { broadcast({ type: "products_changed" }); } catch {}
  res.json({ ok: true });
});

app.put("/admin/product/:id", authAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    name,
    price,
    description,
    longDescription,
    image,
    images,
    category,
    rating,
    originalPrice,
    discountPercent,
    discountedPrice,
    features,
    warranty2yr,
    freeShipping,
    thirtyDayReturns,
    warrantyText,
    shippingText,
    returnsText,
  } = req.body;
  const r = await Product.findByIdAndUpdate(
    id,
    {
      name,
      price,
      description,
      longDescription,
      image,
      images,
      category,
      rating,
      originalPrice,
      discountPercent,
      discountedPrice,
      features,
      warranty2yr,
      freeShipping,
      thirtyDayReturns,
      warrantyText,
      shippingText,
      returnsText,
    },
    { new: true }
  );
  if (!r) return res.status(404).send("not found");
  try { broadcast({ type: "products_changed" }); } catch {}
  res.json(r);
});

 

app.get("/orders", async (req, res) => {
  const email = (req.query.email as string) || "";
  const list = await Order.find(email ? { "customer.email": email } : {}).sort({ createdAt: -1 });
  res.json(list);
});

 

 

app.get('/', (req,res) => {
    res.send("hello from server");
})

const isServerless = Boolean(process.env.VERCEL);
let server: any = null;
if (!isServerless) {
  const port = Number(process.env.PORT || 3000);
  server = app.listen(port, () => {
    console.log(`server is running on port ${port}`);
  });
}

function broadcast(data: any) {
  const msg = JSON.stringify(data);
  if (!wss) return;
  wss.clients.forEach((client: any) => {
    if (client.readyState === 1) client.send(msg);
  });
}
if (!isServerless && server) {
  wss = new WebSocketServer({ server });
  wss.on("connection", (ws: WebSocket) => {
    ws.send(JSON.stringify({ type: "hello" }));
  });
}

app.post("/orders", async (req, res) => {
  try {
    const o = await Order.create(req.body);
    broadcast({ type: "orders_changed" });
    res.status(201).json(o);
  } catch (e: any) {
    res.status(400).send(e?.message || "bad request");
  }
});

app.patch("/admin/order/:id/approve", authAdmin, async (req, res) => {
  const { id } = req.params;
  const r = await Order.findByIdAndUpdate(id, { status: "delivered" }, { new: true });
  if (!r) return res.status(404).send("not found");
  broadcast({ type: "orders_changed" });
  res.json(r);
});

app.patch("/admin/order/:id/status", authAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status?: string };
  const allowed = ["pending", "on_the_way", "delivered"];
  if (!status || !allowed.includes(status)) return res.status(400).send("invalid status");
  const r = await Order.findByIdAndUpdate(id, { status }, { new: true });
  if (!r) return res.status(404).send("not found");
  broadcast({ type: "orders_changed" });
  res.json(r);
});

app.delete("/admin/order/:id", authAdmin, async (req, res) => {
  const { id } = req.params;
  const o = await Order.findById(id);
  if (!o) return res.status(404).send("not found");
  if (o.status !== "delivered") return res.status(400).send("only delivered orders can be deleted");
  await Order.findByIdAndDelete(id);
  broadcast({ type: "orders_changed" });
  res.json({ ok: true });
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dvvfdfzrg",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});
app.post("/admin/upload-images", authAdmin, async (req, res) => {
  try {
    const { images } = req.body as { images?: string[] };
    if (!Array.isArray(images) || images.length < 1 || images.length > 5) {
      const arr = Array.isArray(images) ? images.slice(0, 5) : [];
      return res.json({ urls: arr });
    }
    const hasCreds = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET,
    );
    if (!hasCreds) {
      return res.json({ urls: images });
    }
    const uploaded: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const dataUrl = images[i];
      const result = await cloudinary.uploader.upload(dataUrl, {
        folder: "products",
        overwrite: false,
        transformation: [{ crop: "fill", gravity: "auto", width: 800, height: 800, fetch_format: "auto", quality: "auto" }],
      });
      uploaded.push(result.secure_url);
    }
    res.json({ urls: uploaded });
  } catch (e: any) {
    const { images } = req.body as { images?: string[] };
    if (Array.isArray(images) && images.length >= 1 && images.length <= 5) {
      return res.json({ urls: images });
    }
    res.status(400).send(e?.message || "upload failed");
  }
});

app.post("/admin/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) return res.status(400).send("invalid");
    let admin = await Admin.findOne({ email });
    if (!admin && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && email === process.env.ADMIN_EMAIL) {
      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      await Admin.create({ email, passwordHash: hash });
      admin = await Admin.findOne({ email });
    }
    if (!admin) return res.status(401).send("unauthorized");
    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) return res.status(401).send("unauthorized");
    const token = jwt.sign({ id: String(admin._id) }, jwtSecret, { expiresIn: "7d" });
    res.json({ token });
  } catch (e: any) {
    res.status(400).send(e?.message || "bad request");
  }
});

export default app;
