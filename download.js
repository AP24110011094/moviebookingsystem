const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, 'database.sql');
const imagesDir = path.join(__dirname, 'images');

if (!fs.existsSync(imagesDir)){
    fs.mkdirSync(imagesDir);
}

let sqlContent = fs.readFileSync(sqlPath, 'utf8');

const urlRegex = /'(images\/[^']+)'/g;
let match;
const downloads = [];

while ((match = urlRegex.exec(sqlContent)) !== null) {
    const localPath = match[1];
    const filename = localPath.substring(localPath.lastIndexOf('/') + 1);
    const destPath = path.join(imagesDir, filename);
    
    // Find movie title for the placeholder
    const lineStart = sqlContent.lastIndexOf('(', match.index);
    const firstQuote = sqlContent.indexOf("'", lineStart);
    const secondQuote = sqlContent.indexOf("'", firstQuote + 1);
    let title = sqlContent.substring(firstQuote + 1, secondQuote);
    if (!title || title.length > 50) title = "Movie";

    downloads.push({ filename, destPath, title });
}

async function downloadImage(filename, dest, title) {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
        console.log(`Already exists: ${dest}`);
        return;
    }
    
    try {
        console.log(`Downloading placeholder for: ${title}`);
        const encodedTitle = encodeURIComponent(title.replace(/\s+/g, '\n'));
        const placeholderUrl = `https://placehold.co/500x750/1a1a2e/ffffff/png?text=${encodedTitle}`;
        const response = await fetch(placeholderUrl);
        
        if (!response.ok) throw new Error(`Placeholder failed: ${response.status}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(dest, buffer);
        console.log(`Downloaded: ${dest}`);
    } catch (err) {
        console.error(`Error downloading ${title}: ${err.message}`);
    }
}

async function downloadAll() {
    console.log(`Processing ${downloads.length} images...`);
    for (const item of downloads) {
        await downloadImage(item.filename, item.destPath, item.title);
    }
    console.log('All downloads completed. Run node migrate.js to update database.');
}

downloadAll();
