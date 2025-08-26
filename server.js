const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

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
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

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

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        next();
    } else {
        res.status(401).json({ error: 'Invalid admin credentials' });
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

// Admin login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
});

// Excel upload and conversion
app.post('/api/admin/upload', authenticateAdmin, upload.single('excelFile'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        
        // Read Excel file
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Process and validate data
        const routes = [];
        const stops = new Set();
        
        jsonData.forEach((row, index) => {
            // Normalize column names (handle different cases)
            const from = row.From || row.from || row.FROM;
            const to = row.To || row.to || row.TO;
            const distance = parseFloat(row.Distance || row.distance || row.DISTANCE || 0);
            const fare = parseFloat(row.Fare || row.fare || row.FARE || 0);
            
            if (from && to && !isNaN(distance) && !isNaN(fare)) {
                routes.push({
                    from: from.toString().trim(),
                    to: to.toString().trim(),
                    distance: distance,
                    fare: fare
                });
                
                stops.add(from.toString().trim());
                stops.add(to.toString().trim());
            } else {
                console.warn(`Skipping invalid row ${index + 1}:`, row);
            }
        });
        
        if (routes.length === 0) {
            return res.status(400).json({ 
                error: 'No valid routes found. Please check your Excel file format.' 
            });
        }
        
        // Create fare data structure
        const fareData = {
            routes: routes,
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
        
        // Clean up uploaded file in case of error
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
        
        // Search for direct route
        const directRoute = fareData.routes.find(route => 
            route.from.toLowerCase() === from.toLowerCase() && 
            route.to.toLowerCase() === to.toLowerCase()
        );
        
        if (directRoute) {
            res.json({
                success: true,
                route: directRoute,
                type: 'direct'
            });
        } else {
            // Search for reverse route
            const reverseRoute = fareData.routes.find(route => 
                route.from.toLowerCase() === to.toLowerCase() && 
                route.to.toLowerCase() === from.toLowerCase()
            );
            
            if (reverseRoute) {
                res.json({
                    success: true,
                    route: {
                        from: from,
                        to: to,
                        distance: reverseRoute.distance,
                        fare: reverseRoute.fare
                    },
                    type: 'reverse'
                });
            } else {
                res.json({
                    success: false,
                    error: 'No route found between the selected stops'
                });
            }
        }
        
    } catch (error) {
        console.error('Error searching fare:', error);
        res.status(500).json({ error: 'Failed to search fare' });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
    }
    
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Handle 404
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
