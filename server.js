const express = require('express');
const multer = require('multer');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Create necessary directories
const ensureDirectoryExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

ensureDirectoryExists('./data');
ensureDirectoryExists('./uploads');

// Simple admin credentials (in production, use environment variables)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'nayeem';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '45984598nayeemmh*';

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Admin authentication middleware for form data (multipart)
const authenticateAdminFormData = (req, res, next) => {
    // For multipart form data, credentials come from req.body
    const { username, password } = req.body;
    
    console.log('Received credentials:', { username, password }); // Debug log
    console.log('Expected credentials:', { ADMIN_USERNAME, ADMIN_PASSWORD }); // Debug log
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        next();
    } else {
        res.status(401).json({ error: 'Invalid admin credentials' });
    }
};

// Admin authentication middleware for JSON requests
const authenticateAdminJSON = (req, res, next) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        next();
    } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
};

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve fare data
app.get('/api/fare-data', (req, res) => {
    try {
        const fareDataPath = path.join(__dirname, 'data', 'fare.json');
        if (fs.existsSync(fareDataPath)) {
            const fareData = JSON.parse(fs.readFileSync(fareDataPath, 'utf8'));
            res.json(fareData);
        } else {
            res.json({ routes: [], stops: [] });
        }
    } catch (error) {
        console.error('Error reading fare data:', error);
        res.status(500).json({ error: 'Failed to read fare data' });
    }
});

// Admin login (JSON)
app.post('/api/admin/login', authenticateAdminJSON, (req, res) => {
    res.json({ success: true, message: 'Login successful' });
});

// Excel upload and conversion (form data)
app.post('/api/admin/upload', upload.single('excelFile'), (req, res, next) => {
    // First handle file upload, then authenticate
    authenticateAdminFormData(req, res, next);
}, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('Processing file:', req.file.originalname); // Debug log

        const filePath = req.file.path;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const worksheet = workbook.worksheets[0];
        const routes = [];
        const stops = new Set();

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // skip header
            const from = row.getCell(1).value ? row.getCell(1).value.toString().trim() : null;
            const to = row.getCell(2).value ? row.getCell(2).value.toString().trim() : null;
            const distance = parseFloat(row.getCell(3).value || 0);
            const fare = parseFloat(row.getCell(4).value || 0);

            if (from && to && !isNaN(distance) && !isNaN(fare)) {
                routes.push({ from, to, distance, fare });
                stops.add(from);
                stops.add(to);
            }
        });

        if (routes.length === 0) {
            return res.status(400).json({ 
                error: 'No valid routes found. Please check your Excel file format.' 
            });
        }

        const fareData = {
            routes,
            stops: Array.from(stops).sort(),
            lastUpdated: new Date().toISOString(),
            totalRoutes: routes.length,
            totalStops: stops.size
        };

        // Backup existing file if it exists
        const fareDataPath = path.join(__dirname, 'data', 'fare.json');
        if (fs.existsSync(fareDataPath)) {
            const backupPath = path.join(__dirname, 'data', `fare_backup_${Date.now()}.json`);
            fs.copyFileSync(fareDataPath, backupPath);
        }

        // Save new fare data
        fs.writeFileSync(fareDataPath, JSON.stringify(fareData, null, 2));

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        res.json({
            success: true,
            message: 'Excel file uploaded and converted successfully',
            data: {
                totalRoutes: routes.length,
                totalStops: stops.size,
                lastUpdated: fareData.lastUpdated
            }
        });

    } catch (error) {
        console.error('Error processing Excel file:', error);

        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ 
            error: 'Failed to process Excel file. Please check the file format and try again.',
            details: error.message 
        });
    }
});

// Search fare between two stops
app.get('/api/search-fare', (req, res) => {
    try {
        const { from, to } = req.query;
        if (!from || !to) {
            return res.status(400).json({ error: 'From and To parameters are required' });
        }

        const fareDataPath = path.join(__dirname, 'data', 'fare.json');
        if (!fs.existsSync(fareDataPath)) {
            return res.status(404).json({ error: 'Fare data not found' });
        }

        const fareData = JSON.parse(fs.readFileSync(fareDataPath, 'utf8'));

        // Direct route
        const directRoute = fareData.routes.find(route => 
            route.from.toLowerCase() === from.toLowerCase() && 
            route.to.toLowerCase() === to.toLowerCase()
        );

        if (directRoute) {
            return res.json({ success: true, route: directRoute, type: 'direct' });
        }

        // Reverse route
        const reverseRoute = fareData.routes.find(route => 
            route.from.toLowerCase() === to.toLowerCase() && 
            route.to.toLowerCase() === from.toLowerCase()
        );

        if (reverseRoute) {
            return res.json({
                success: true,
                route: {
                    from,
                    to,
                    distance: reverseRoute.distance,
                    fare: reverseRoute.fare
                },
                type: 'reverse'
            });
        }

        res.json({ success: false, error: 'No route found between the selected stops' });

    } catch (error) {
        console.error('Search fare error:', error);
        res.status(500).json({ error: 'Failed to search fare', details: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Admin credentials - Username: ${ADMIN_USERNAME}, Password: ${ADMIN_PASSWORD}`);
});