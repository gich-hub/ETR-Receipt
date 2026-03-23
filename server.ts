import express from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(process.cwd(), 'data');
const IMAGES_DIR = path.join(DATA_DIR, 'images');
const CSV_FILE = path.join(DATA_DIR, 'receipts.csv');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

// Initialize CSV with headers if it doesn't exist
const CSV_HEADERS = [
  'id', 'merchantName', 'merchantKraPin', 'date', 
  'totalTaxableAmount', 'totalTax', 'totalAmount', 
  'currency', 'category', 'buyerName', 'buyerPin', 
  'scuSignature', 'status', 'createdAt', 'imageFilename'
];
if (!fs.existsSync(CSV_FILE)) {
  fs.writeFileSync(CSV_FILE, CSV_HEADERS.join(',') + '\n', 'utf-8');
}

// Helper to escape CSV fields
const escapeCSV = (str: string | number | undefined | null) => {
  if (str === undefined || str === null) return '';
  const s = String(str);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, IMAGES_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logger
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => res.json({ ok: true }));

  // Serve uploaded images statically
  app.use('/api/images', express.static(IMAGES_DIR));

  // GET all receipts
  app.get('/api/receipts', (req, res) => {
    console.log('Fetching receipts from:', CSV_FILE);
    try {
      if (!fs.existsSync(CSV_FILE)) {
        console.log('CSV file does not exist, returning empty array');
        return res.json([]);
      }
      const fileContent = fs.readFileSync(CSV_FILE, 'utf-8');
      const lines = fileContent.trim().split('\n');
      console.log(`Found ${lines.length} lines in CSV`);
      if (lines.length <= 1) {
        return res.json([]);
      }
      const headers = lines[0].split(',');
      
      const receipts = lines.slice(1).map((line, i) => {
        try {
          // Simple CSV parser
          const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
          const receipt: any = {};
          headers.forEach((header, index) => {
            receipt[header] = values[index];
          });
          
          // Type conversions
          if (receipt.totalTaxableAmount) receipt.totalTaxableAmount = parseFloat(receipt.totalTaxableAmount);
          if (receipt.totalTax) receipt.totalTax = parseFloat(receipt.totalTax);
          receipt.totalAmount = parseFloat(receipt.totalAmount) || 0;
          receipt.createdAt = parseInt(receipt.createdAt, 10) || Date.now();
          if (receipt.imageFilename) {
            receipt.imageUrl = `/api/images/${receipt.imageFilename}`;
          }
          return receipt;
        } catch (e) {
          console.error(`Error parsing line ${i + 1}:`, line, e);
          return null;
        }
      }).filter(Boolean);
      
      // Sort by createdAt descending
      receipts.sort((a: any, b: any) => b.createdAt - a.createdAt);
      
      console.log(`Returning ${receipts.length} receipts`);
      res.json(receipts);
    } catch (error) {
      console.error('Error reading receipts:', error);
      res.status(500).json({ error: 'Failed to read receipts' });
    }
  });

  // POST new receipt or update existing
  app.post('/api/receipts', upload.single('image'), (req, res) => {
    try {
      const { 
        id, merchantName, merchantKraPin, date, 
        totalTaxableAmount, totalTax, totalAmount, 
        currency, category, buyerName, buyerPin, 
        scuSignature, status, createdAt, phone
      } = req.body;
      
      let imageFilename = req.file ? req.file.filename : '';

      const fileContent = fs.readFileSync(CSV_FILE, 'utf-8');
      const lines = fileContent.trim().split('\n');
      let existingImageFilename = '';
      let isUpdate = false;

      // Check if receipt exists and get its imageFilename
      for (let i = lines.length - 1; i >= 1; i--) {
        const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (values[0] === id) {
          isUpdate = true;
          const foundImage = values[values.length - 1]?.replace(/^"|"$/g, '') || '';
          if (foundImage) {
            existingImageFilename = foundImage;
            break;
          }
        }
      }

      // If no new image was uploaded, keep the existing one
      if (!imageFilename && isUpdate) {
        imageFilename = existingImageFilename;
      }

      const row = [
        id,
        merchantName,
        merchantKraPin,
        date,
        totalTaxableAmount,
        totalTax,
        totalAmount,
        currency,
        category,
        buyerName,
        buyerPin,
        scuSignature,
        status || 'synced',
        createdAt,
        imageFilename
      ].map(escapeCSV).join(',');

      if (isUpdate) {
        // Remove existing rows with this ID and append the new one
        const newLines = lines.filter((line, index) => {
          if (index === 0) return true; // Keep headers
          const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          return values[0] !== id;
        });
        newLines.push(row);
        fs.writeFileSync(CSV_FILE, newLines.join('\n') + '\n', 'utf-8');
      } else {
        // Append new row
        fs.appendFileSync(CSV_FILE, row + '\n', 'utf-8');
      }

      res.status(201).json({ success: true, id, imageFilename });
    } catch (error) {
      console.error('Error saving receipt:', error);
      res.status(500).json({ error: 'Failed to save receipt' });
    }
  });

  // DELETE a receipt
  app.delete('/api/receipts/:id', (req, res) => {
    try {
      const idToDelete = req.params.id;
      const fileContent = fs.readFileSync(CSV_FILE, 'utf-8');
      const lines = fileContent.trim().split('\n');
      
      let imageToDelete = '';
      const newLines = lines.filter((line, index) => {
        if (index === 0) return true; // Keep headers
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (values[0] === idToDelete) {
          // imageFilename is the last column
          imageToDelete = values[values.length - 1]?.replace(/^"|"$/g, ''); 
          return false;
        }
        return true;
      });

      fs.writeFileSync(CSV_FILE, newLines.join('\n') + '\n', 'utf-8');

      // Delete the image file if it exists
      if (imageToDelete) {
        const imagePath = path.join(IMAGES_DIR, imageToDelete);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting receipt:', error);
      res.status(500).json({ error: 'Failed to delete receipt' });
    }
  });

  // Intercept /receipt/:id to inject Open Graph tags for bots
  app.get('/receipt/:id', async (req, res, next) => {
    try {
      const userAgent = req.headers['user-agent'] || '';
      const isBot = /bot|facebook|whatsapp|twitter|linkedin|telegram/i.test(userAgent);
      
      if (!isBot) {
        return next(); // Let Vite handle it for normal browsers
      }

      const id = req.params.id;
      if (!fs.existsSync(CSV_FILE)) return next();
      
      const fileContent = fs.readFileSync(CSV_FILE, 'utf-8');
      const lines = fileContent.trim().split('\n');
      
      let merchantName = 'Receipt';
      let imageFilename = '';
      let totalAmount = '';
      let currency = '';
      
      for (let i = lines.length - 1; i >= 1; i--) {
        const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (values[0] === id) {
          merchantName = values[1]?.replace(/^"|"$/g, '') || 'Receipt';
          totalAmount = values[6]?.replace(/^"|"$/g, '') || '';
          currency = values[7]?.replace(/^"|"$/g, '') || '';
          imageFilename = values[values.length - 1]?.replace(/^"|"$/g, '') || '';
          break;
        }
      }

      if (!imageFilename) return next();

      const baseUrl = process.env.APP_URL || `http://${req.headers.host}`;
      const imageUrl = `${baseUrl}/api/images/${imageFilename}`;
      const title = `Receipt: ${merchantName} - ${currency} ${totalAmount}`;
      
      const metaTags = `
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="Scanned with ETR Receipts" />
        <meta property="og:image" content="${imageUrl}" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="${imageUrl}" />
      `;
      
      let html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf-8');
      html = html.replace('</head>', `${metaTags}</head>`);
      
      res.send(html);
    } catch (e) {
      console.error('Error serving receipt meta tags:', e);
      next();
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
