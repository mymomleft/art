const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Configure file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// In-memory database (replace with real database in production)
let artDatabase = [];
let ratingsDatabase = {};

// API endpoints
app.use(express.static('public'));
app.use(express.json());

// Upload artwork
app.post('/api/art', upload.array('artFiles'), (req, res) => {
    const { title, description } = req.body;
    const files = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        type: file.mimetype.split('/')[0] // 'image', 'audio', etc.
    }));
    
    const newArt = {
        id: Date.now(),
        title,
        description,
        files,
        averageRating: 0,
        ratingCount: 0
    };
    
    artDatabase.push(newArt);
    res.json(newArt);
});

// Get all artworks
app.get('/api/art', (req, res) => {
    res.json(artDatabase);
});

// Rate artwork
app.post('/api/art/:id/rate', (req, res) => {
    const { id } = req.params;
    const { rating, userId } = req.body;
    
    if (!ratingsDatabase[id]) {
        ratingsDatabase[id] = {};
    }
    
    // Store rating (in production, validate user, etc.)
    ratingsDatabase[id][userId] = rating;
    
    // Update average rating
    const artIndex = artDatabase.findIndex(item => item.id == id);
    if (artIndex !== -1) {
        const ratings = Object.values(ratingsDatabase[id]);
        const sum = ratings.reduce((a, b) => a + b, 0);
        artDatabase[artIndex].averageRating = sum / ratings.length;
        artDatabase[artIndex].ratingCount = ratings.length;
    }
    
    res.json({ success: true });
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});