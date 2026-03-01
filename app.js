import express from "express";
import orderRoutes from "./modules/order/order.route.js";

const app = express();
app.use(express.json());

app.use("/api/v1/orders", orderRoutes);

export default app;