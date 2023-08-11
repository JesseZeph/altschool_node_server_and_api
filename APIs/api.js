const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3001;
const itemPath = path.join(__dirname, 'items.json');

const loadItemsFromFile = () => {
    try {
        const fileContents = fs.readFileSync(itemPath, 'utf8');
        const parsedItems = JSON.parse(fileContents);
        return Array.isArray(parsedItems) ? parsedItems : [];
    } catch (error) {
        return [];
    }
};


const saveItemsToFile = () => {
    const jsonItems = JSON.stringify(items, null, 2);
    fs.writeFileSync(itemPath, jsonItems, 'utf8');
};

const items = loadItemsFromFile();

const handleResponse = (req, res) => ({ code = 200, error = null, data = null }) => {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(code);
    res.write(JSON.stringify({ data, error }));
    res.end();
};

const bodyParser = (req, res, callback) => {
    const itemBody = [];

    req.on('data', (chunk) => {
        itemBody.push(chunk);
    });

    req.on('end', () => {
        if (itemBody.length) {
            const parsedItem = Buffer.concat(itemBody).toString();
            req.itemBody = JSON.parse(parsedItem);
        }

        callback(req, res);
    });
};

const handleRequest = (req, res) => {
    const response = handleResponse(req, res);

    if (req.url === '/items' && req.method === 'POST') {
        items.push({ ...req.itemBody, id: Math.floor(Math.random() * 700).toString() });
        saveItemsToFile();
        return response({ data: items, code: 201 });
    }

    if (req.url === '/items' && req.method === 'GET') {
        return response({ data: items, code: 200 });
    }

    if (req.url.startsWith('/items/') && req.method === 'GET') {
        const id = req.url.split('/')[2];

        const itemIndex = items.findIndex((item) => item.id === id);

        if (itemIndex === -1) {
            return response({ code: 404, error: 'Item not found', data: null });
        }

        const item = items[itemIndex];

        return response({ data: item, code: 200 });
    }

    if (req.url.startsWith('/items/') && req.method === 'PATCH') {
        const id = req.url.split('/')[2];

        const itemIndex = items.findIndex((item) => item.id === id);

        if (itemIndex === -1) {
            return response({ code: 404, error: 'Item not found', data: null });
        }

        const item = items[itemIndex];

        items[itemIndex] = { ...item, ...req.itemBody };

        saveItemsToFile();

        return response({ data: items[itemIndex], code: 200 });
    }

    if (req.url.startsWith('/items/') && req.method === 'DELETE') {
        const id = req.url.split('/')[2];

        const itemIndex = items.findIndex((item) => item.id === id);

        if (itemIndex === -1) {
            return response({ code: 404, error: 'Item not found', data: null });
        }

        items.splice(itemIndex, 1);

        saveItemsToFile();

        return response({ data: items, code: 200 });
    }
};

const server = http.createServer((req, res) => bodyParser(req, res, handleRequest));

server.listen(port, () => {
    console.log(`Server running at port ${port}`);
});