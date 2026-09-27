import { app } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

await connectDB();
app.listen(env.PORT, () => {
  console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});
