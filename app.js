import express from 'express';

import userRoutes from './modules/user/user.route.js';
import mealRoutes from './modules/meal/meal.route.js';
import categoryRoutes from './modules/category/category.route.js';

const app = express();

app.use(express.json());

// 🔹 Routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/meals', mealRoutes);
app.use('/api/v1/categories', categoryRoutes);

export default app;
