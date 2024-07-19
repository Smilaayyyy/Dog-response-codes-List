const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios'); 
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware
app.use(express.json()); // Body parser middleware

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/http-dog-app', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// User model
const User = mongoose.model('User', new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
}));
const responseCodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
});

const ResponseCode = mongoose.model('ResponseCode', responseCodeSchema);

const listSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    name: String,
    responseCodes: [{
        code: String,
        imageUrl: String,
    }],
});

const List = mongoose.model('List', listSchema);
const SavedListSchema = new mongoose.Schema({
    listName: String,
    creationDate: Date,
    responseCodes: [String],
    imageLinks: [String],
});

// Create a model based on the schema
const SavedList = mongoose.model('SavedList', SavedListSchema);

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, 'your_secret_key', (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Failed to authenticate token' });
        req.userId = decoded.userId;
        next();
    });
};

app.get('/api/search', async (req, res) => {
    const { filter } = req.query;
    
    if (!filter) {
        return res.status(400).json({ message: 'Filter parameter is required' });
    }

    // Generate list of status codes based on the filter pattern
    let statusCodes = [];
    if (/^\d{2}x$/.test(filter)) {
        // Pattern: 2xx, 3xx, etc.
        for (let i = 0; i < 10; i++) {
            statusCodes.push(`${filter[0]}${filter[1]}${i}`);
        }
    } else if (/^\d{3}$/.test(filter)) {
        // Exact status code
        statusCodes.push(filter);
    } else if (/^\d{1}xx$/.test(filter)) {
        // Pattern: 20xx, 21xx, etc.
        for (let i = 0; i < 100; i++) {
            statusCodes.push(`${filter[0]}${Math.floor(i / 10)}${i % 10}`);
        }

    } else {
        return res.status(400).json({ message: 'Invalid filter pattern' });
    }

    try {
        const imageUrls = await Promise.all(statusCodes.map(async (code) => {
            const url = `https://http.dog/${code}.jpg`;
            try {
                const response = await axios.get(url, { responseType: 'arraybuffer' });
                if (response.status === 200) {
                    return url;
                }
            } catch (error) {
                console.error(`Failed to fetch image for code ${code}:`, error.message);
                return null;
            }
        }));

        const validImageUrls = imageUrls.filter(Boolean);
        res.json({ imageUrls: validImageUrls });
    } catch (error) {
        console.error('Failed to fetch images', error);
        res.status(500).json({ message: 'Failed to fetch images', error: error.message });
    }
});
app.post('/api/Lists', async (req, res) => {
    const { listName, creationDate, responseCodes, imageLinks } = req.body;

    try {
        const newList = new SavedList({
            listName,
            creationDate: new Date(creationDate),
            responseCodes,
            imageLinks,
        });

        await newList.save();
        res.status(201).json({ message: 'List saved successfully' });
    } catch (error) {
        console.error('Error saving list:', error);
        res.status(500).json({ error: 'Failed to save list' });
    }
});
app.get('/api/Lists', async (req, res) => {
    try {
        const lists = await SavedList.find({ userId: req.userId });
        res.json(lists);
    } catch (error) {
        console.error('Error fetching lists:', error);
        res.status(500).json({ error: 'Failed to fetch lists' });
    }
});
// Example endpoint to fetch list details by ID
app.get('/api/Lists/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const list = await List.findById(listId);
        if (!list) return res.status(404).json({ message: 'List not found' });
        res.json(list);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching list details' });
    }
});

// Update an existing list by ID
app.put('/api/Lists/:id', async (req, res) => {
    const { id } = req.params;
    const { listName, responseCodes, imageLinks } = req.body;

    try {
        const updatedList = await SavedList.findByIdAndUpdate(id, {
            listName,
            responseCodes,
            imageLinks,
        }, { new: true });

        if (!updatedList) {
            return res.status(404).json({ error: 'List not found' });
        }

        res.json(updatedList);
    } catch (error) {
        console.error('Error updating list:', error);
        res.status(500).json({ error: 'Failed to update list' });
    }
});
app.post('/api/auth/signup', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const user = new User({
            username,
            password: hashedPassword
        });
        const savedUser = await user.save();
        console.log('User created successfully:', savedUser);
        
        // Generate JWT
        const token = jwt.sign({ userId: savedUser._id }, 'your_jwt_secret', { expiresIn: '1h' });
        
        res.status(201).json({ token, userId: savedUser._id });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Please provide username and password' });
        }
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: 'User not found. Please register first.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user._id }, 'your_jwt_secret', { expiresIn: '1h' });
        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Fetch all lists with the same name
app.get('/api/lists/by-name/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const lists = await List.find({ listName: name }); // Replace with your query logic
        res.json(lists);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch lists' });
    }
});

// Delete a list by ID
app.delete('/api/Lists/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedList = await SavedList.findByIdAndDelete(id);
        if (!deletedList) {
            return res.status(404).json({ error: 'List not found' });
        }
        res.json({ message: 'List deleted successfully' });
    } catch (error) {
        console.error('Error deleting list:', error);
        res.status(500).json({ error: 'Failed to delete list' });
    }
});
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});