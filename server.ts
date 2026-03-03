import express from "express";
import { createServer as createViteServer } from "vite";
import { OAuth2Client } from "google-auth-library";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;

  const oauth2Client = new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    `${APP_URL}/auth/google/callback`
  );

  // Auth Routes
  app.get("/api/auth/google/url", (req, res) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({ error: "Google OAuth credentials not configured" });
    }
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/drive.file"],
      prompt: "consent",
    });
    res.json({ url });
  });

  app.get("/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      // Store tokens in a secure cookie
      res.cookie("google_tokens", JSON.stringify(tokens), {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error exchanging code for tokens:", error);
      res.status(500).send("Authentication failed");
    }
  });

  app.get("/api/auth/status", (req, res) => {
    const tokens = req.cookies.google_tokens;
    res.json({ connected: !!tokens });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("google_tokens");
    res.json({ success: true });
  });

  // Backup Routes
  app.post("/api/backup/upload", async (req, res) => {
    const tokensStr = req.cookies.google_tokens;
    if (!tokensStr) return res.status(401).json({ error: "Not connected to Google Drive" });

    const tokens = JSON.parse(tokensStr);
    oauth2Client.setCredentials(tokens);

    try {
      const { data } = req.body;
      const fileName = "spendwise_backup.json";
      
      // Search for existing file
      const listResponse = await oauth2Client.request({
        url: `https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and trashed=false`,
      });
      
      const files = (listResponse.data as any).files;
      const fileId = files && files.length > 0 ? files[0].id : null;

      const metadata = {
        name: fileName,
        mimeType: "application/json",
      };

      const media = {
        mimeType: "application/json",
        body: JSON.stringify(data),
      };

      if (fileId) {
        // Update existing file
        await oauth2Client.request({
          url: `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
          method: "PATCH",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
          },
        });
      } else {
        // Create new file
        // This is a multipart upload in a simpler way for drive v3
        // For simplicity, we use two requests or a more complex multipart.
        // Let's use the simple upload for the content first if we don't care about metadata as much,
        // but Drive v3 upload with metadata usually requires multipart.
        // Alternatively, use the 'google-auth-library' to make a simpler request.
        
        const createResponse = await oauth2Client.request({
          url: "https://www.googleapis.com/drive/v3/files",
          method: "POST",
          data: metadata,
        });
        
        const newFileId = (createResponse.data as any).id;
        
        await oauth2Client.request({
          url: `https://www.googleapis.com/upload/drive/v3/files/${newFileId}?uploadType=media`,
          method: "PATCH",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Backup upload error:", error);
      res.status(500).json({ error: "Failed to upload backup" });
    }
  });

  app.get("/api/backup/download", async (req, res) => {
    const tokensStr = req.cookies.google_tokens;
    if (!tokensStr) return res.status(401).json({ error: "Not connected to Google Drive" });

    const tokens = JSON.parse(tokensStr);
    oauth2Client.setCredentials(tokens);

    try {
      const fileName = "spendwise_backup.json";
      const listResponse = await oauth2Client.request({
        url: `https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and trashed=false`,
      });
      
      const files = (listResponse.data as any).files;
      if (!files || files.length === 0) {
        return res.status(404).json({ error: "No backup found" });
      }

      const fileId = files[0].id;
      const fileResponse = await oauth2Client.request({
        url: `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        responseType: "json",
      });

      res.json({ data: fileResponse.data });
    } catch (error) {
      console.error("Backup download error:", error);
      res.status(500).json({ error: "Failed to download backup" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
