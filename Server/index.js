import cors from "cors";
import express from "express";
import db from "./db.js";
import routes from "./routes.js";

const env = process.env.APP_MODE;


if (env === "dev") {
  const app = express();
  const PORT = 8000;

  app.use(express.json());
  const allowedOrigins = ["http://localhost:5173"];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    })
  );

  routes(app, db);

  app.listen(PORT, () =>
    console.log(`Сервер запущен на порту ${PORT}, в режиме ${env}`)
  );
}

if (env === "prod") {
  const app = express();
  const PORT = 8000;

  app.use(express.json());

  app.use(
    cors({
      origin: "*",
      credentials: true,
    })
  );

  routes(app, db);

  app.listen(PORT, () =>
    console.log(`Сервер запущен на порту ${PORT}, в режиме ${env}`)
  );
}
