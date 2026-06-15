import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join, relative } from "path";
import fs from "fs";
import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const uploadsDir = join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(
  cors({
    origin: process.env.FRONTEND_URI || true,
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
  }),
);

app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      // console.log(`Server running on port http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    throw err;
  });

const contentSchema = new mongoose.Schema({
  type: String,
  content: String,
  filename: String,
  code: String,
  createdAt: { type: Date, default: Date.now, expires: 7*86400 },
});

const Content = mongoose.model("Content", contentSchema);

const generateUniqueCode = async () => {
  while (true) {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const existing = await Content.findOne({ code });
    if (!existing) return code;
  }
};

// Routes
app.post("/api/upload/text", async (req, res) => {
  try {
    const { content } = req.body;
    const code = await generateUniqueCode();

    const newContent = new Content({
      type: "text",
      content,
      code,
    });

    await newContent.save();
    res.json({ code });
  } catch (error) {
    res.status(500).json({ error: "Error uploading text" });
  }
});

app.post("/api/upload/file", upload.array("files"), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const savedFiles = [];

    for (const file of req.files) {
      const code = await generateUniqueCode();
      const storedPath = relative(__dirname, file.path);

      const newContent = new Content({
        type: "file",
        content: storedPath,
        filename: file.originalname,
        code,
      });

      await newContent.save();
      savedFiles.push({ filename: file.originalname, code });
    }

    res.json({ codes: savedFiles });
  } catch (error) {
    res.status(500).json({ error: "Error uploading file" });
  }
});

app.get("/api/content/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const content = await Content.findOne({ code });

    if (!content) {
      return res.status(404).json({ error: "Content not found" });
    }

    res.json(content);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving content" });
  }
});

// Download route
app.get("/api/download/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const content = await Content.findOne({ code });

    if (!content) {
      return res.status(404).json({ error: "Content not found" });
    }

    if (content.type !== "file") {
      return res.status(400).json({ error: "Content is not a file" });
    }

    // Get the absolute path to the file
    const filePath = join(__dirname, content.content);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    // Set headers for file download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(content.filename)}"`,
    );
    res.setHeader("Content-Type", "application/octet-stream");

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error in download route:", error);
    res.status(500).json({ error: "Error downloading file" });
  }
});

// Delete all data route
app.delete("/api/delete-all", async (req, res) => {
  try {
    const uploadsDir = join(__dirname, "uploads");
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        const filePath = join(uploadsDir, file);
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error(`Error deleting file ${filePath}:`, err);
        }
      }
    }

    await Content.deleteMany({});

    res.json({
      message: "Successfully deleted all content",
      filesDeleted: true,
      databaseCleared: true,
    });
  } catch (error) {
    console.error("Error in delete-all route:", error);
    res.status(500).json({
      error: "Failed to delete all content",
      message: error.message,
    });
  }
});

const CLEANUP_INTERVAL = 7 * 24 * 60 * 60 * 1000;

// setInterval(async () => {
//     try {
//         const response = await fetch(process.env.BACKEND_URL + `/api/delete-all`, {
//             method: 'DELETE'
//         });
//         const data = await response.json();
//         console.log('Scheduled cleanup completed:', data);
//     } catch (error) {
//         console.error('Error during scheduled cleanup:', error);
//     }
// }, CLEANUP_INTERVAL);

app.get("/api/hello", (req, res) => {
  res.status(200).json({ message: "Hello, World!" });
});
