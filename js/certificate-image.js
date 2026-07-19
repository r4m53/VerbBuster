function drawAvatar(ctx, avatar, x, y, scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.fillStyle = '#d9f43b'; ctx.strokeStyle = '#172033'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.arc(90, 90, 86, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = avatar.jersey; ctx.beginPath(); ctx.moveTo(39, 167); ctx.quadraticCurveTo(45, 115, 90, 115); ctx.quadraticCurveTo(135, 115, 141, 167); ctx.fill(); ctx.stroke();
  ctx.fillStyle = avatar.skin; ctx.beginPath(); ctx.arc(90, 76, 43, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = avatar.hair; ctx.beginPath(); ctx.moveTo(49, 72); ctx.quadraticCurveTo(48, 23, 91, 23); ctx.quadraticCurveTo(134, 23, 134, 70); ctx.quadraticCurveTo(116, 59, 109, 41); ctx.quadraticCurveTo(83, 69, 49, 72); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#172033'; ctx.beginPath(); ctx.arc(74, 78, 4, 0, 7); ctx.arc(106, 78, 4, 0, 7); ctx.fill();
  ctx.font = 'bold 25px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(avatar.number, 90, 160);
  ctx.restore();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' '); let line = ''; let row = 0;
  for (const word of words) {
    const test = `${line}${word} `;
    if (ctx.measureText(test).width > maxWidth && line) { ctx.fillText(line.trim(), x, y + row * lineHeight); line = `${word} `; row += 1; }
    else line = test;
  }
  ctx.fillText(line.trim(), x, y + row * lineHeight);
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = source;
  });
}

export async function certificateCanvas(award) {
  const canvas = document.createElement('canvas'); canvas.width = 1600; canvas.height = 1000;
  const ctx = canvas.getContext('2d'); const theme = award.definition;
  ctx.fillStyle = theme.secondary; ctx.fillRect(0, 0, 1600, 1000);
  ctx.fillStyle = theme.primary; ctx.beginPath(); ctx.moveTo(850, 0); ctx.lineTo(1600, 0); ctx.lineTo(1600, 1000); ctx.lineTo(1120, 1000); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff8e9'; ctx.beginPath(); ctx.moveTo(1320, 0); ctx.lineTo(1600, 0); ctx.lineTo(1600, 1000); ctx.lineTo(1480, 1000); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#172033'; ctx.lineWidth = 18; ctx.strokeRect(24, 24, 1552, 952);
  ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = 'bold 30px Arial'; ctx.fillText('VERB BUSTER LEAGUE', 65, 70);
  ctx.textAlign = 'right'; ctx.fillStyle = theme.secondary; ctx.font = 'bold 24px Arial'; ctx.fillText(`CERTIFICATE ${String(award.number).padStart(2, '0')}  •  ${theme.tier.toUpperCase()} ${theme.rank}`, 1530, 70);
  ctx.textAlign = 'left'; ctx.fillStyle = '#d9f43b'; ctx.font = 'bold 25px Arial'; ctx.fillText('WEEKLY MISSION', 75, 160);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 92px Arial'; ctx.fillText('MISSION', 70, 250); ctx.fillText('COMPLETE!', 70, 345);
  drawAvatar(ctx, award.avatar, 80, 395, 1.6);
  ctx.fillStyle = '#d9f43b'; ctx.font = 'bold 22px Arial'; ctx.fillText(`NEW ${theme.tier.toUpperCase()} VERB BUSTER`, 410, 480);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 58px Arial'; ctx.fillText(award.nickname, 410, 550);
  ctx.fillStyle = theme.secondary; ctx.beginPath(); ctx.arc(1270, 330, 205, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 14; ctx.stroke();
  if (theme.image) {
    try { const character = await loadImage(theme.image); ctx.drawImage(character, 1060, 120, 420, 420); }
    catch { ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 110px Arial'; ctx.fillText(theme.character.charAt(0), 1270, 365); }
  } else { ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 110px Arial'; ctx.fillText(theme.character.charAt(0), 1270, 365); }
  ctx.font = 'bold 42px Arial'; wrapText(ctx, theme.character.toUpperCase(), 1270, 580, 430, 48);
  ctx.font = 'bold 23px Arial'; ctx.fillText(theme.theme.toUpperCase(), 1270, 650);
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#172033'; ctx.lineWidth = 5; ctx.fillRect(815, 690, 690, 150); ctx.strokeRect(815, 690, 690, 150);
  ctx.fillStyle = '#172033'; ctx.textAlign = 'center'; ctx.font = 'italic 24px Georgia'; wrapText(ctx, `“${theme.message}”`, 1160, 750, 600, 34);
  const stats = [[award.points, 'LEAGUE POINTS'], [award.battlesCompleted, 'BATTLES'], [award.questionsMastered || '—', 'QUESTIONS MASTERED']];
  ctx.fillStyle = '#fff'; ctx.fillRect(45, 865, 1510, 90); ctx.strokeStyle = '#172033'; ctx.lineWidth = 5; ctx.strokeRect(45, 865, 1510, 90);
  stats.forEach(([value, label], index) => { const x = 295 + index * 500; ctx.textAlign = 'center'; ctx.fillStyle = theme.primary; ctx.font = 'bold 34px Arial'; ctx.fillText(value, x, 905); ctx.fillStyle = '#172033'; ctx.font = 'bold 17px Arial'; ctx.fillText(label, x, 934); });
  return canvas;
}

export async function downloadCertificate(award) {
  const canvas = await certificateCanvas(award);
  const link = document.createElement('a');
  link.download = `verb-buster-${award.definition.tier}-${award.number}.png`;
  link.href = canvas.toDataURL('image/png'); link.click();
}
