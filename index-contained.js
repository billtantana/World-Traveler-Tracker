import "dotenv/config";
import express from "express";
import session from "express-session";
import containedRoutes from "./routes/containedRoutes.js";

const app = express();
const port = 3000;

// Middleware
// Use to parse incoming request bodies from HTML
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SV_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);

// Use for files located in public directory
app.use(express.static("public"));

app.use("/", containedRoutes);

// Start the server and show the local URL in the terminal.
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
