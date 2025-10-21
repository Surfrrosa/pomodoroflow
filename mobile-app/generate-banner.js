#!/usr/bin/env node
/**
 * Generate PomodoroFlow Feature Graphic (1024x500) with actual icon
 */

const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function generateBanner() {
  const canvas = createCanvas(1024, 500);
  const ctx = canvas.getContext('2d');

  // Dark gradient background
  const gradient = ctx.createLinearGradient(0, 0, 1024, 500);
  gradient.addColorStop(0, '#1f2329');
  gradient.addColorStop(1, '#2d3338');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 500);

  // Load and draw the actual icon
  try {
    const iconPath = path.join(__dirname, 'assets', 'icon.png');
    const icon = await loadImage(iconPath);

    // Draw icon on left side with circular mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(200, 250, 120, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(icon, 80, 130, 240, 240);
    ctx.restore();

    // Timer arc around icon
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(200, 250, 135, -Math.PI/2, Math.PI * 1.5);
    ctx.stroke();

    // Active progress indicator (75% complete)
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(200, 250, 135, -Math.PI/2, Math.PI);
    ctx.stroke();

  } catch (err) {
    console.error('Error loading icon:', err);
    // Fallback: draw simple tomato
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.arc(200, 250, 120, 0, Math.PI * 2);
    ctx.fill();
  }

  // App name - modern typography
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 64px -apple-system, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('PomodoroFlow', 380, 200);

  // Tagline
  ctx.fillStyle = '#B0B0B0';
  ctx.font = '28px -apple-system, system-ui, sans-serif';
  ctx.fillText('Focus. Flow. Achieve.', 380, 240);

  // Accent line
  ctx.strokeStyle = '#FF6B6B';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(380, 260);
  ctx.lineTo(500, 260);
  ctx.stroke();

  // Feature highlights
  const features = [
    { icon: '🍅', text: '25-minute focus sessions' },
    { icon: '📊', text: 'Track your productivity' },
    { icon: '🔔', text: 'Smart break reminders' }
  ];

  ctx.font = '20px -apple-system, system-ui, sans-serif';
  features.forEach((feature, index) => {
    const y = 290 + (index * 35);

    // Feature icon background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(395, y - 6, 15, 0, Math.PI * 2);
    ctx.fill();

    // Feature text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px -apple-system, system-ui, sans-serif';
    ctx.fillText(feature.icon, 388, y);

    ctx.fillStyle = '#E0E0E0';
    ctx.fillText(feature.text, 425, y);
  });

  // "FREE" badge
  ctx.fillStyle = '#4CAF50';
  ctx.beginPath();
  ctx.arc(950, 80, 40, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px -apple-system, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FREE', 950, 85);

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  const outputPath = path.join(__dirname, 'assets', 'feature-graphic-new.png');
  fs.writeFileSync(outputPath, buffer);

  console.log('✓ Feature graphic generated successfully!');
  console.log(`  Saved to: ${outputPath}`);
  console.log('  Size: 1024x500px');
  console.log('  Format: PNG');
}

generateBanner().catch(err => {
  console.error('Error generating banner:', err);
  process.exit(1);
});
