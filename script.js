// ── BYPASS FUNCTIONS ──
async function submitBypass() {
  const type = document.getElementById("type").value;
  const password = document.getElementById("password").value.trim();
  const cookie = document.getElementById("cookie").value.trim();
  const responseEl = document.getElementById("responseData");
  const submitBtn = document.getElementById("submitBtn");

  if (!password || !cookie) {
    showToast("❌ Please fill in all fields");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = 'Processing...';
  responseEl.innerText = "Sending request to API proxy...";

  try {
    const res = await fetch('/api/bypass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        Type: type, 
        Password: password, 
        Cookie: cookie 
      })
    });

    const contentType = res.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
      responseEl.innerText = JSON.stringify(data, null, 2);
    } else {
      data = await res.text();
      responseEl.innerText = data;
    }

    if (!res.ok) {
      showToast("❌ Error: " + (data.message || res.status));
    } else {
      showToast("✅ Request completed");
    }
  } catch (err) {
    responseEl.innerText = "Error: " + err.message;
    showToast("❌ Network error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Submit <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 5.5H9.5M6.5 2.5L9.5 5.5L6.5 8.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
}

function clearAll() {
  document.getElementById("password").value = "";
  document.getElementById("cookie").value = "";
  document.getElementById("responseData").innerText = "Waiting for submission...";
  showToast("🗑️ Cleared all fields");
}

function copyResponse() {
  const responseEl = document.getElementById("responseData");
  const text = responseEl.innerText;
  
  if (text && !text.includes("Waiting") && !text.includes("Sending")) {
    navigator.clipboard.writeText(text).then(() => {
      showToast("✅ Response copied to clipboard");
    }).catch(() => {
      showToast("❌ Failed to copy");
    });
  }
}

function showToast(text) {
  const toast = document.getElementById("toast");
  toast.innerText = text;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}