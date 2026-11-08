import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join, relative } from "path";
import fs from "fs";
import dotenv from "dotenv";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, ".env") });

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

const fileItemSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  path: { type: String, required: true },
  size: { type: Number },
  mimetype: { type: String },
});

const contentSchema = new mongoose.Schema({
  type: { type: String, required: true },
  content: String,
  filename: String,
  files: [fileItemSchema],
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 7 * 86400 },
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

    const code = await generateUniqueCode();
    const fileRecords = req.files.map((file) => ({
      filename: file.originalname,
      path: relative(__dirname, file.path),
      size: file.size,
      mimetype: file.mimetype,
    }));

    const newContent = new Content({
      type: "file",
      code,
      files: fileRecords,
      content: fileRecords[0].path,
      filename: fileRecords[0].filename,
    });

    await newContent.save();

    res.json({
      code,
      files: newContent.files.map((f) => ({
        id: f._id.toString(),
        filename: f.filename,
        size: f.size,
      })),
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Error uploading file" });
  }
});

app.get("/api/content/:code", async (req, res) => {
  try {
    const { code } = req.params;
    const contents = await Content.find({ code });

    if (!contents || contents.length === 0) {
      return res.status(404).json({ error: "Content not found" });
    }

    const first = contents[0];
    if (first.type === "text") {
      return res.json({
        type: "text",
        content: first.content,
        code: first.code,
        createdAt: first.createdAt,
      });
    }

    const files = [];
    for (const record of contents) {
      if (record.files && record.files.length > 0) {
        for (const f of record.files) {
          files.push({
            id: f._id ? f._id.toString() : f.path,
            filename: f.filename,
            size: f.size,
            mimetype: f.mimetype,
          });
        }
      } else if (record.filename || record.content) {
        files.push({
          id: record._id.toString(),
          filename: record.filename || "file",
          size: null,
          mimetype: null,
        });
      }
    }

    res.json({
      type: "file",
      code: first.code,
      files,
      filename: files[0]?.filename || "",
      createdAt: first.createdAt,
    });
  } catch (error) {
    console.error("Error retrieving content:", error);
    res.status(500).json({ error: "Error retrieving content" });
  }
});

// Download route
app.get("/api/download/:code/:fileId?", async (req, res) => {
  try {
    const { code } = req.params;
    const fileId = req.params.fileId || req.query.fileId;
    const contents = await Content.find({ code });

    if (!contents || contents.length === 0) {
      return res.status(404).json({ error: "Content not found" });
    }

    let targetFile = null;

    for (const record of contents) {
      if (record.files && record.files.length > 0) {
        if (fileId) {
          const match = record.files.find(
            (f) =>
              (f._id && f._id.toString() === fileId) ||
              f.filename === fileId ||
              f.path === fileId,
          );
          if (match) {
            targetFile = match;
            break;
          }
        } else {
          targetFile = record.files[0];
          break;
        }
      } else if (record.filename || record.content) {
        if (!fileId || record._id.toString() === fileId || record.filename === fileId) {
          targetFile = {
            path: record.content,
            filename: record.filename,
          };
          break;
        }
      }
    }

    if (!targetFile) {
      return res.status(404).json({ error: "File not found" });
    }

    const filePath = join(__dirname, targetFile.path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(targetFile.filename)}"`,
    );
    res.setHeader(
      "Content-Type",
      targetFile.mimetype || "application/octet-stream",
    );

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
