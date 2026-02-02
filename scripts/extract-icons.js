/**
 * Extract weather icons from sprite sheet
 * Splits weather-icons.jpg (3 rows × 4 columns = 12 icons) into individual PNG files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SPRITE_SHEET = path.join(__dirname, '../public/weather-icons.jpg');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

// Icon names in order (left to right, top to bottom)
const ICON_NAMES = [
  'sun',                    // 0: Row 1, Col 1 - Sun (Clear/Sunny day)
  'moon',                   // 1: Row 1, Col 2 - Crescent Moon (Clear night)
  'cloudy',                 // 2: Row 1, Col 3 - Cloudy
  'partly-cloudy',          // 3: Row 1, Col 4 - Partly Cloudy (day)
  'light-rain',            // 4: Row 2, Col 1 - Light Rain
  'partly-cloudy-rain',    // 5: Row 2, Col 2 - Partly Cloudy with Rain
  'rain',                   // 6: Row 2, Col 3 - Rain
  'thunderstorm',          // 7: Row 2, Col 4 - Thunderstorm
  'thunderstorm-rain',     // 8: Row 3, Col 1 - Thunderstorm with Rain
  'snowflake',             // 9: Row 3, Col 2 - Snowflake (Freezing)
  'snow',                   // 10: Row 3, Col 3 - Snow
  'sleet'                   // 11: Row 3, Col 4 - Sleet
];

async function extractIcons() {
  try {
    // Check if sprite sheet exists
    if (!fs.existsSync(SPRITE_SHEET)) {
      console.error(`Error: Sprite sheet not found at ${SPRITE_SHEET}`);
      process.exit(1);
    }

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      console.log(`Created directory: ${OUTPUT_DIR}`);
    }

    // Get image metadata
    const metadata = await sharp(SPRITE_SHEET).metadata();
    const { width, height } = metadata;
    
    console.log(`Sprite sheet dimensions: ${width}x${height}`);
    console.log(`Grid: 3 rows × 4 columns = 12 icons`);
    
    // Calculate icon dimensions
    const iconWidth = Math.floor(width / 4);
    const iconHeight = Math.floor(height / 3);
    
    console.log(`Icon dimensions: ${iconWidth}x${iconHeight}`);
    console.log(`\nExtracting icons...\n`);

    // Extract each icon
    for (let i = 0; i < 12; i++) {
      const row = Math.floor(i / 4);
      const col = i % 4;
      
      const left = col * iconWidth;
      const top = row * iconHeight;
      
      const iconName = ICON_NAMES[i];
      const outputPath = path.join(OUTPUT_DIR, `${iconName}.png`);
      
      // Extract icon
      const iconBuffer = await sharp(SPRITE_SHEET)
        .extract({
          left,
          top,
          width: iconWidth,
          height: iconHeight
        })
        .png()
        .toBuffer();
      
      // Trim transparent padding and save
      await sharp(iconBuffer)
        .trim({
          threshold: 10 // Trim pixels with alpha < 10 (nearly transparent)
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Extracted: ${iconName}.png (row ${row + 1}, col ${col + 1})`);
    }

    console.log(`\n✅ Successfully extracted 12 icons to ${OUTPUT_DIR}`);
    console.log(`\nIcon files:`);
    ICON_NAMES.forEach((name, i) => {
      console.log(`  ${i.toString().padStart(2, '0')}. ${name}.png`);
    });

  } catch (error) {
    console.error('Error extracting icons:', error);
    process.exit(1);
  }
}

// Run extraction
extractIcons();

