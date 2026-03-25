import express from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(process.cwd(), 'data');
const IMAGES_DIR = path.join(DATA_DIR, 'images');
const DB_FILE = path.join(DATA_DIR, 'receipts.db');
const CSV_FILE = path.join(DATA_DIR, 'receipts.csv');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

// Initialize SQLite Database
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS receipts (
    id TEXT PRIMARY KEY,
    merchantName TEXT,
    merchantKraPin TEXT,
    date TEXT,
    totalTaxableAmount REAL,
    totalTax REAL,
    totalAmount REAL,
    currency TEXT,
    category TEXT,
    buyerPin TEXT,
    cuInvoiceNumber TEXT,
    status TEXT,
    createdAt INTEGER,
    imageFilename TEXT
  )
`);

// Migrate existing CSV data to SQLite if DB is empty and CSV exists
try {
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM receipts');
  const { count } = countStmt.get() as { count: number };
  
  if (count === 0 && fs.existsSync(CSV_FILE)) {
    console.log('Migrating data from CSV to SQLite...');
    const fileContent = fs.readFileSync(CSV_FILE, 'utf-8');
    const lines = fileContent.trim().split('\n');
    
    if (lines.length > 1) {
      const headers = lines[0].split(',');
      const insertStmt = db.prepare(`
        INSERT INTO receipts (
          id, merchantName, merchantKraPin, date, 
          totalTaxableAmount, totalTax, totalAmount, 
          currency, category, buyerPin, 
          cuInvoiceNumber, status, createdAt, imageFilename
        ) VALUES (
          @id, @merchantName, @merchantKraPin, @date, 
          @totalTaxableAmount, @totalTax, @totalAmount, 
          @currency, @category, @buyerPin, 
          @cuInvoiceNumber, @status, @createdAt, @imageFilename
        )
      `);
      
      const insertMany = db.transaction((receipts) => {
        for (const receipt of receipts) insertStmt.run(receipt);
      });
      
      const receiptsToInsert = lines.slice(1).map((line) => {
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
        const receipt: any = {};
        headers.forEach((header, index) => {
          receipt[header] = values[index];
        });
        
        return {
          id: receipt.id,
          merchantName: receipt.merchantName,
          merchantKraPin: receipt.merchantKraPin,
          date: receipt.date,
          totalTaxableAmount: receipt.totalTaxableAmount ? parseFloat(receipt.totalTaxableAmount) : null,
          totalTax: receipt.totalTax ? parseFloat(receipt.totalTax) : null,
          totalAmount: parseFloat(receipt.totalAmount) || 0,
          currency: receipt.currency,
          category: receipt.category,
          buyerPin: receipt.buyerPin,
          cuInvoiceNumber: receipt.cuInvoiceNumber,
          status: receipt.status || 'synced',
          createdAt: parseInt(receipt.createdAt, 10) || Date.now(),
          imageFilename: receipt.imageFilename || ''
        };
      });
      
      insertMany(receiptsToInsert);
      console.log(`Migrated ${receiptsToInsert.length} receipts to SQLite.`);
      
      // Rename CSV to backup
      fs.renameSync(CSV_FILE, `${CSV_FILE}.bak`);
    }
  }
} catch (err) {
  console.error('Migration error:', err);
}

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
  app.get('/api/receipts', async (req, res) => {
    try {
      const receipts = db.prepare('SELECT * FROM receipts ORDER BY createdAt DESC').all() as any[];
      
      const mappedReceipts = receipts.map(r => ({
        ...r,
        // If it starts with http, it's a Firebase URL. Otherwise, it's a local filename.
        imageUrl: r.imageFilename 
          ? (r.imageFilename.startsWith('http') ? r.imageFilename : `/api/images/${r.imageFilename}`) 
          : undefined
      }));
      
      res.json(mappedReceipts);
    } catch (error) {
      console.error('Error reading receipts:', error);
      res.status(500).json({ error: 'Failed to read receipts' });
    }
  });

  // GET a single receipt
  app.get('/api/receipts/:id', async (req, res) => {
    try {
      const receipt = db.prepare('SELECT * FROM receipts WHERE id = ?').get(req.params.id) as any;
      if (!receipt) {
        return res.status(404).json({ error: 'Receipt not found' });
      }
      
      const mappedReceipt = {
        ...receipt,
        imageUrl: receipt.imageFilename 
          ? (receipt.imageFilename.startsWith('http') ? receipt.imageFilename : `/api/images/${receipt.imageFilename}`) 
          : undefined
      };
      
      res.json(mappedReceipt);
    } catch (error) {
      console.error('Error reading receipt:', error);
      res.status(500).json({ error: 'Failed to read receipt' });
    }
  });

  // POST new receipt or update existing
  app.post('/api/receipts', upload.single('image'), async (req, res) => {
    try {
      const { 
        id, merchantName, merchantKraPin, date, 
        totalTaxableAmount, totalTax, totalAmount, 
        currency, category, buyerPin, 
        cuInvoiceNumber, status, createdAt, imageUrl
      } = req.body;
      
      let imageFilename = imageUrl || '';

      // If a new file was uploaded, use its filename
      if (req.file) {
        imageFilename = req.file.filename;
      }

      // If no new image was provided, keep the existing one
      if (!imageFilename) {
        const existing = db.prepare('SELECT imageFilename FROM receipts WHERE id = ?').get(id) as any;
        if (existing && existing.imageFilename) {
          imageFilename = existing.imageFilename;
        }
      }

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO receipts (
          id, merchantName, merchantKraPin, date, 
          totalTaxableAmount, totalTax, totalAmount, 
          currency, category, buyerPin, 
          cuInvoiceNumber, status, createdAt, imageFilename
        ) VALUES (
          @id, @merchantName, @merchantKraPin, @date, 
          @totalTaxableAmount, @totalTax, @totalAmount, 
          @currency, @category, @buyerPin, 
          @cuInvoiceNumber, @status, @createdAt, @imageFilename
        )
      `);

      stmt.run({
        id,
        merchantName: merchantName || 'Unknown',
        merchantKraPin: merchantKraPin || null,
        date: date || new Date().toISOString().split('T')[0],
        totalTaxableAmount: totalTaxableAmount ? parseFloat(totalTaxableAmount) : null,
        totalTax: totalTax ? parseFloat(totalTax) : null,
        totalAmount: parseFloat(totalAmount) || 0,
        currency: currency || 'USD',
        category: category || 'Other',
        buyerPin: buyerPin || null,
        cuInvoiceNumber: cuInvoiceNumber || null,
        status: status || 'synced',
        createdAt: parseInt(createdAt, 10) || Date.now(),
        imageFilename
      });

      res.status(201).json({ success: true, id, imageFilename });
    } catch (error) {
      console.error('Error saving receipt:', error);
      res.status(500).json({ error: 'Failed to save receipt' });
    }
  });

  // DELETE a receipt
  app.delete('/api/receipts/:id', async (req, res) => {
    try {
      const idToDelete = req.params.id;
      
      const existing = db.prepare('SELECT imageFilename FROM receipts WHERE id = ?').get(idToDelete) as any;
      
      db.prepare('DELETE FROM receipts WHERE id = ?').run(idToDelete);

      // Delete the image file if it exists and is a local file
      if (existing && existing.imageFilename && !existing.imageFilename.startsWith('http')) {
        const imagePath = path.join(IMAGES_DIR, existing.imageFilename);
        if (fs.existsSync(imagePath)) {
          await fs.promises.unlink(imagePath);
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
      const receipt = db.prepare('SELECT * FROM receipts WHERE id = ?').get(id) as any;
      
      if (!receipt || !receipt.imageFilename) return next();

      const baseUrl = process.env.APP_URL || `http://${req.headers.host}`;
      const imageUrl = receipt.imageFilename.startsWith('http') 
        ? receipt.imageFilename 
        : `${baseUrl}/api/images/${receipt.imageFilename}`;
      const title = `Receipt: ${receipt.merchantName} - ${receipt.currency} ${receipt.totalAmount}`;
      
      const metaTags = `
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="Scanned with ETR Receipts" />
        <meta property="og:image" content="${imageUrl}" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="${imageUrl}" />
      `;
      
      let html = await fs.promises.readFile(path.join(process.cwd(), 'index.html'), 'utf-8');
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
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
