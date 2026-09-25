import { spawn } from 'child_process';

// Cloudflare Quick Tunnel: akkauntsiz, ogohlantirish sahifasisiz bepul HTTPS manzil.
// Manzil har ishga tushganda yangi bo'ladi, shuning uchun bot menyu tugmasi har safar avtomatik yangilanadi.
export function startCloudflareTunnel(port) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.env.CLOUDFLARED_PATH || 'cloudflared',
      ['tunnel', '--url', `http://localhost:${port}`, '--no-autoupdate'],
      { windowsHide: true }
    );
    let resolved = false;
    const timer = setTimeout(() => reject(new Error('cloudflared 60 soniya ichida manzil bermadi')), 60_000);

    const onOutput = (chunk) => {
      const match = chunk.toString().match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (match && !resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(match[0]);
      }
    };
    child.stdout.on('data', onOutput);
    child.stderr.on('data', onOutput);

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err.code === 'ENOENT' ? new Error("cloudflared topilmadi. O'rnatish: winget install --id Cloudflare.cloudflared") : err);
    });
    child.on('exit', (code) => {
      clearTimeout(timer);
      if (resolved) console.error(`⚠️  Tunnel to'xtadi (kod ${code}) — Mini App Telegram'da ochilmaydi, serverni qayta ishga tushiring`);
      else reject(new Error(`cloudflared to'xtadi (kod ${code})`));
    });

    process.once('exit', () => child.kill());
  });
}
