import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const spritePath = path.join(__dirname, '../public/icons/weather-icons-v2.jpg');
const outputDir = path.join(__dirname, '../public/weather-icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Sprite dimensions
const SPRITE_WIDTH = 1199;
const SPRITE_HEIGHT = 858;
const COLS = 4;
const ROWS = 3;
const ICON_WIDTH = Math.floor(SPRITE_WIDTH / COLS); // 299px to fit all columns
const ICON_HEIGHT = Math.floor(SPRITE_HEIGHT / ROWS); // 286px

// Icon names in order (left to right, top to bottom)
const iconNames = [
  '0_sun.png',
  '1_moon.png',
  '2_cloudy.png',
  '3_partly_cloudy.png',
  '4_light_rain.png',
  '5_sun_rain.png',
  '6_rain.png',
  '7_thunder.png',
  '8_thunder_rain.png',
  '9_snow.png',
  '10_snow_cloud.png',
  '11_snow_rain.png'
];

async function splitSprite() {
  try {
    const metadata = await sharp(spritePath).metadata();
    
    console.log(`Sprite dimensions: ${metadata.width}x${metadata.height}`);
    console.log(`Icon size: ${ICON_WIDTH}x${ICON_HEIGHT}`);
    
    for (let i = 0; i < 12; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const left = col * ICON_WIDTH;
      const top = row * ICON_HEIGHT;
      
      // Calculate actual width/height to avoid going out of bounds
      const actualWidth = Math.min(ICON_WIDTH, SPRITE_WIDTH - left);
      const actualHeight = Math.min(ICON_HEIGHT, SPRITE_HEIGHT - top);
      
      const outputPath = path.join(outputDir, iconNames[i]);
      
      // Reload image for each extraction
      await sharp(spritePath)
        .extract({
          left: left,
          top: top,
          width: actualWidth,
          height: actualHeight
        })
        .png()
        .toFile(outputPath);
      
      console.log(`Extracted ${iconNames[i]} from (${left}, ${top}) size ${actualWidth}x${actualHeight}`);
    }
    
    console.log('All icons extracted successfully!');
  } catch (error) {
    console.error('Error splitting sprite:', error);
    process.exit(1);
  }
}

splitSprite();

