//entry point
import mongoose from 'mongoose';
import app from './app.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose
  .connect(process.env.DB_LOCAL)
  .then(() => console.log(' MongoDB Connected'))
  .catch((err) => console.log('DB Error:', err));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
